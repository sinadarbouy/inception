/*
 * Licensed to the Technische Universität Darmstadt under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The Technische Universität Darmstadt 
 * licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.
 *  
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package de.tudarmstadt.ukp.clarin.webanno.api.annotation.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import de.tudarmstadt.ukp.clarin.webanno.api.AnnotationSchemaService;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.AnnotationEditorExtension;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.AnnotationEditorExtensionRegistry;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.AnnotationEditorExtensionRegistryImpl;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.AnnotationEditorFactory;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.AnnotationEditorRegistry;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.AnnotationEditorRegistryImpl;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.coloring.ColoringService;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.coloring.ColoringServiceImpl;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.layer.LayerSupportRegistry;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.rendering.PreRenderer;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.rendering.PreRendererImpl;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.rendering.RenderingPipeline;
import de.tudarmstadt.ukp.clarin.webanno.api.annotation.rendering.RenderingPipelineImpl;

@Configuration
public class AnnotationAutoConfiguration
{
    @Bean
    public AnnotationEditorExtensionRegistry annotationEditorExtensionRegistry(
            @Lazy @Autowired(required = false) List<AnnotationEditorExtension> aExtensions)
    {
        return new AnnotationEditorExtensionRegistryImpl(aExtensions);
    }

    @Bean
    public AnnotationEditorRegistry annotationEditorRegistry(
            @Lazy @Autowired(required = false) List<AnnotationEditorFactory> aExtensions)
    {
        return new AnnotationEditorRegistryImpl(aExtensions);
    }

    @Bean
    public RenderingPipeline renderingPipeline(PreRenderer aPreRenderer,
            AnnotationEditorExtensionRegistry aExtensionRegistry,
            AnnotationSchemaService aAnnotationService, ColoringService aColoringService,
            AnnotationEditorProperties aProperties)
    {
        return new RenderingPipelineImpl(aPreRenderer, aExtensionRegistry, aAnnotationService,
                aColoringService, aProperties);
    }

    @Bean
    public ColoringService coloringService(AnnotationSchemaService aSchemaService)
    {
        return new ColoringServiceImpl(aSchemaService);
    }

    @Bean
    public PreRenderer preRenderer(LayerSupportRegistry aLayerSupportRegistry,
            AnnotationSchemaService aAnnotationService)
    {
        return new PreRendererImpl(aLayerSupportRegistry, aAnnotationService);
    }
}
