import * as annoUI from '../../anno-ui'
import { anyOf, dispatchWindowEvent } from '../../shared/util'
import { convertToExportY, paddingBetweenPages, nextZIndex } from '../../shared/coords'
import { adjustViewerSize } from '../util/window'
import AnnotationContainer from '../../core/src/annotation/container'

/**
 * PDFAnno's Annotation functions for Page produced by .
 */
export default class PDFAnnoPage {

  annotationContainer: AnnotationContainer;

  constructor(annotationContainer: AnnotationContainer) {
    this.annotationContainer = annotationContainer;
    this.autoBind()
  }

  autoBind() {
    Object.getOwnPropertyNames(this.constructor.prototype)
      .filter(prop => typeof this[prop] === 'function')
      .forEach(method => {
        this[method] = this[method].bind(this)
      })
  }

  /**
   * Start PDFAnno Application.
   */
  startViewerApplication() {
    // Adjust the height of viewer.
    adjustViewerSize()

    dispatchWindowEvent('iframeReady')
  }

  displayViewer(contentFile) {

    // Reset settings.
    this.resetPDFViewerSettings()

    // Load PDF.
    const uint8Array = new Uint8Array(contentFile.content)
    window.PDFViewerApplication.open(uint8Array)

    // Set the PDF file name.
    window.PDFView.url = contentFile.name
  }

  /**
   * Start the viewer.
   */
  initializeViewer(viewerSelector = '#viewer') {

    window.pdf = null
    window.pdfName = null

    // Reset setting.
    this.resetPDFViewerSettings()
  }

  /**
   * Close the viewer.
   */
  closePDFViewer() {
    if (window.PDFViewerApplication) {
      window.PDFViewerApplication.close()
      $('#numPages', window.document).text('')
      // this.currentContentFile = null
      dispatchWindowEvent('didCloseViewer')
    }
  }

  /**
   * Reset the setting of PDFViewer.
   */
  resetPDFViewerSettings() {
    localStorage.removeItem('database')
  }

  /**
   * Create a Span annotation.
   */
  createSpan({ text = null, color = null } = {}) {
    // Get user selection.
    const rects = window.PDFAnnoCore.default.UI.getRectangles()
    console.log('createSpan:rects:', rects)

    // Get selected annotations.
    const selectedAnnotations = this.annotationContainer.getSelectedAnnotations()

    // Check empty.
    if (!rects && selectedAnnotations.length === 0) {
      console.log('check:', rects)
      return annoUI.ui.alertDialog.show({ message: 'Select text span or an annotation.' })
    }

    // Change color and label.
    if (selectedAnnotations.length > 0) {
      selectedAnnotations
        .filter(anno => anno.type === 'span')
        .forEach(anno => {
          anno.color = color
          anno.text = text
          anno.render()
          anno.enableViewMode()
        })

      // Create a new rectAnnotation.
    } else if (rects) {
      window.PDFAnnoCore.default.UI.createSpan({ text, zIndex: nextZIndex(), color })
    }

    // Notify annotation added.
    dispatchWindowEvent('annotationrendered')
  }

  /**
   * Create a Relation annotation.
   */
  createRelation({ type, text = null, color = null } = {}) {

    // for old style.
    if (arguments.length === 1 && typeof arguments[0] === 'string') {
      type = arguments[0]
    }

    // If a user select relation annotation(s), change the color and text only.
    const relAnnos = this..annotationContainer.getSelectedAnnotations()
      .filter(anno => anno.type === 'relation')
    if (relAnnos.length > 0) {
      relAnnos
        .filter(anno => anno.direction === type)
        .forEach(anno => {
          anno.text = text
          anno.color = color
          anno.render()
          anno.enableViewMode()
        })
      return
    }

    let selectedAnnotations = this..annotationContainer.getSelectedAnnotations()
    selectedAnnotations = selectedAnnotations.filter(a => {
      return a.type === 'span'
    }).sort((a1, a2) => {
      return (a1.selectedTime - a2.selectedTime) // asc
    })

    if (selectedAnnotations.length < 2) {
      return annoUI.ui.alertDialog.show({ message: 'Two annotated text spans are not selected.\nTo select multiple annotated spans, click the first annotated span, then Ctrl+Click (Windows) or Cmd+Click (OSX) the second span.' })
    }

    const first = selectedAnnotations[selectedAnnotations.length - 2]
    const second = selectedAnnotations[selectedAnnotations.length - 1]
    console.log('first:second,', first, second)

    // Check duplicated.
    const arrows = this.annotationContainer
      .getAllAnnotations()
      .filter(a => a.type === 'relation')
      .filter(a => {
        return anyOf(a.rel1Annotation.uuid, [first.uuid, second.uuid])
          && anyOf(a.rel2Annotation.uuid, [first.uuid, second.uuid])
      })

    if (arrows.length > 0) {
      console.log('same found!!!')
      // Update!!
      arrows[0].direction = type
      arrows[0].rel1Annotation = first
      arrows[0].rel2Annotation = second
      arrows[0].text = text
      arrows[0].color = color || arrows[0].color
      arrows[0].save()
      arrows[0].render()
      arrows[0].enableViewMode()
      window.dispatchEvent(event)
      return
    }

    window.PDFAnnoCore.default.UI.createRelation({
      type,
      anno1: first,
      anno2: second,
      text,
      color
    })

    // Notify annotation added.
    dispatchWindowEvent('annotationrendered')
  }

  /**
   * Find an annotation by id.
   */
  findAnnotationById(id: String) {
    return this.annotationContainer.findById(id)
  }

  /**
   * Clear the all annotations from the view and storage.
   */
  clearAllAnnotations() {
    if (this.annotationContainer) {
      this.annotationContainer.getAllAnnotations().forEach(a => a.destroy())
    }
  }

  /**
   * Add an annotation to the container.
   */
  addAnnotation(annotation) {
    this.annotationContainer.add(annotation)
  }

  validateSchemaErrors(errors) {
    let messages = []
    errors.forEach(error => {
      Object.keys(error).forEach(key => {
        let value = error[key]
        value = typeof value === 'object' ? JSON.stringify(value) : value
        messages.push(`${key}: ${value}`)
      })
      messages.push('')
    })
    return messages.join('<br />')
  }

  /**
   * Import annotations from UI.
   */
  importAnnotation(paperData, isPrimary) {
    this.annotationContainer.importAnnotations(paperData, isPrimary).then(() => {
      // Notify annotations added.
      dispatchWindowEvent('annotationrendered')
    }).catch(errors => {
      let message = errors
      if (Array.isArray(errors)) {
        message = this.validateSchemaErrors(errors)
      }
      console.error('Unable to import annotations.', errors);
    })
  }

  /**
   * Scroll window to the annotation.
   */
  scrollToAnnotation(id: String) {

    let annotation = this.findAnnotationById(id)

    if (annotation) {

      // scroll to.
      let pageNumber, y
      if (annotation.type === 'span') {
        pageNumber = annotation.page
        y = annotation.rectangles[0].y
      } else {
        let _y = annotation.y || annotation.y1
        let d = convertToExportY(_y)
        pageNumber = d.pageNumber
        y = d.y
      }
      let pageHeight = this.getViewerViewport().height
      let scale = this.getViewerViewport().scale
      let _y = (pageHeight + paddingBetweenPages) * (pageNumber - 1) + y * scale
      _y -= 100
      $('#viewer').parent()[0].scrollTop = _y

      // highlight.
      annotation.highlight()
      setTimeout(() => annotation.dehighlight(), 1000)
    }
  }

  /**
   * Get the viewport of the viewer.
   */
  getViewerViewport() {
    return window.PDFView.pdfViewer.getPageView(0).viewport
  }

  /**
   * Load PDF data from url.
   * @memberof PDFAnnoPage
   */
  loadPdf(url: String): Promise<Uint8Array> {
    // add noise to the query parameters so caching is prevented
    var antiCacheUrl = url + "&time=" + new Date().getTime();
    return fetch(antiCacheUrl, {
      method: 'GET',
      mode: 'cors'
    }).then(response => {
      if (response.ok) {
        return response.arrayBuffer()
      } else {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`)
      }
    }).then(buffer => {
      return new Uint8Array(buffer)
    })
  }

  /**
   * Load pdftxt data from url.
   * @memberof PDFAnnoPage
   */
  loadPdftxt(url: string): Promise<String> {
    // add noise to the query parameters so caching is prevented
    var antiCacheUrl = url + "&time=" + new Date().getTime();
    return fetch(antiCacheUrl, {
      method: 'GET',
      mode: 'cors'
    }).then(response => {
      if (response.ok) {
        return response.text()
      } else {
        throw new Error(`HTTP ${response.status} - pdftxt`)
      }
    })
  }

  /**
   * Load PDF and pdftxt from url.
   * @memberof PDFAnnoPage
   */
  loadPDFFromServer(pdfURL: string, pdftxtURL: string): Promise<Object> {
    return Promise.all([
      this.loadPdf(pdfURL),
      this.loadPdftxt(pdftxtURL)
    ]).then(results => {
      return {
        pdf: results[0],
        analyzeResult: results[1]
      }
    })
  }
}
