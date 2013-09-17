/*******************************************************************************
 * @license
 *  Copyright (c) 2013 GoPivotal, Inc.
 *  All rights reserved. This program and the accompanying materials
 *  are made available under the terms of the Eclipse Public License v1.0
 *  which accompanies this distribution, and is available at
 *  http://www.eclipse.org/legal/epl-v10.html
 *
 *  Contributors:
 *      GoPivotal, Inc. - initial API and implementation
 *******************************************************************************/
define("orion/editor/javaContentAssist", ['orion/editor/Deferred'], function(Deferred) {
	
	var currentCallbackId = 0;
	var callbacks = {};
		
	function JavaContentAssistProvider(socket) {
		socket.on('contentassistresponse', function (data) {
			if(callbacks.hasOwnProperty(data.callback_id)) {
				console.log(callbacks[data.callback_id]);
				callbacks[data.callback_id].cb.resolve(data.proposals);
				delete callbacks[data.callback_id];
			}
		});
	}
	
	// This creates a new callback ID for a request
	function getCallbackId() {
		currentCallbackId += 1;
		if(currentCallbackId > 10000) {
			currentCallbackId = 0;
		}
		return currentCallbackId;
	}

    function sendContentAssistRequest(request, socket) {
		var deferred = new Deferred();

		var callbackId = getCallbackId();
		callbacks[callbackId] = {
			time : new Date(),
			cb : deferred
		};

		request.callback_id = callbackId;
		socket.emit('contentassistrequest', request);

		return deferred.promise;
    }
	
	JavaContentAssistProvider.prototype =
	{
		computeProposals: function(buffer, offset, context) {
			var request = {
				'resource' : this.resourcePath,
				'offset' : offset
			};
			
			var deferred = sendContentAssistRequest(request, this.socket);
			return deferred;
		},
		
		setResourcePath: function(resourcePath) {
			this.resourcePath = resourcePath;
		},
		
		setSocket: function(socket) {
			this.socket = socket;
		}
		
	}
	
	return {
		JavaContentAssistProvider: JavaContentAssistProvider
	};
});