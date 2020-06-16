function createJSON(method, options) {
    var token = localStorage.getItem('token') || '';
    var json = {
        'jsonrpc': 2.0,
        'method': method,
        'id': '',
        'params': [
            'token:' + token
        ]
    };
    if (options) {
        if (options.gid) {
            json.params.push(options.gid);
        }
        if (options.url) {
            json.params.push([options.url]);
        }
        if (options.params) {
            json.params = [...json.params, ...options.params];
        }
    }
    return json;
}

function jsonRPCRequest(json, success, failure) {
    success = success || function() {};
    failure = failure || function() {};
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (json.length) {
            var result = response.map(item => item = item.result);
            if (result[0]) {
                return success(...result);
            }
            var error = response.map(item => item = item.error);
            if (error[0]) {
                error = error[0].message;
            }
        }
        else {
            if (response.result) {
                return success(response.result);
            }
            if (response.error) {
                error = error.message;
            }
        }
        if (error === 'Unauthorized') {
            return failure(error, rpc);
        }
        failure(error);
    };
    xhr.onerror = () => {
        failure('No response', rpc);
    };
    xhr.send(JSON.stringify(json));
}

function downWithAria2(url, referer) {
    if (referer) {
        chrome.cookies.getAll({'url': referer}, (cookies) => {
            var params = {
                'header': [
                    'Referer: ' + referer,
                    'Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' ')
                ]
            }
            downloadRequest(createJSON('aria2.addUri', {'url': url, 'params': [params]}), url);
        });
    }
    else {
        downloadRequest(createJSON('aria2.addUri', {'url': url}), url);
    }
}

function downloadRequest(json, url) {
    jsonRPCRequest(
        json,
        (result) => {
            showNotification('Downloading', url);
        },
        (error, rpc) => {
            showNotification(error, rpc || url);
        }
    );
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        'type': 'basic',
        'title': title,
        'iconUrl': 'icons/icon64.png',
        'message': message
    };
    chrome.notifications.create(id, notification, () => {
        window.setTimeout(() => {
            chrome.notifications.clear(id);
        }, 5000);
    });
}
