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
package de.tudarmstadt.ukp.inception.websocket.config;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import de.tudarmstadt.ukp.inception.websocket.InboundChannelInterceptor;

@Configuration
@EnableWebSocketMessageBroker
@ConditionalOnProperty(prefix = "websocket", name = "enabled", havingValue = "true")
public class WebsocketConfig
    implements WebSocketMessageBrokerConfigurer
{

    public static final String WS_ENDPOINT = "/ws-endpoint";
    
    private ChannelInterceptor[] inboundInterceptors;
    
    /**
     * @param aInboundInterceptors
     *            interceptors that will be added to the client inbound channel e.g. to check authorization
     *            before subscription
     */
    public WebsocketConfig(@Autowired InboundChannelInterceptor[] aInboundInterceptors) {
        inboundInterceptors = aInboundInterceptors;
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry aRegistry)
    {
        aRegistry.addEndpoint(WS_ENDPOINT); // client will use this endpoint to first establish connection
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry aRegistry)
    {
        aRegistry.enableSimpleBroker("/queue", "/topic"); // broker will send to destinations with this
                                                // prefix,
                                                // queue is custom for user-specific channels.
                                                // client will subscribe to /queue/{subtopic} where
                                                // subtopic is a specific topic that
                                                // controller or service will address messages to
        aRegistry.setApplicationDestinationPrefixes("/app"); // clients should send messages to
                                                             // channels pre-fixed with this
        aRegistry.setPreservePublishOrder(true); // messages to clients are by default not ordered,
                                                 // need to explicitly set order here
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration aRegistration)
    {
        aRegistration.interceptors(inboundInterceptors);
    }
   
}
