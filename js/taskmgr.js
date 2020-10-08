$('div.taskQueue').on('click', (event) => {
    var taskInfo = $('div.taskInfo').has($(event.target));
    var status = taskInfo.attr('status');
    var gid = taskInfo.attr('gid');
    var name = taskInfo.attr('name');
    if (event.target.id === 'show_btn') {
        $('#taskDetails').show();
        printTaskDetails(gid);
    }
    else if (event.target.id === 'retry_btn') {
        retryTask(gid);
    }
    else if (event.target.id === 'remove_btn') {
        removeTask(status, gid);
    }
    else if (event.target.id === 'progress_btn') {
        toggleTask(status, gid);
    }
});

function removeTask(status, gid) {
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'aria2.forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else {
        return console.log(status);
    }
    jsonRPCRequest({'method': method, 'gid': gid});
}

function toggleTask(status, gid) {
    if (['active', 'waiting'].includes(status)) {
        var method = 'aria2.pause';
    }
    else if (status === 'paused') {
        method = 'aria2.unpause';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else {
        return console.log(status);
    }
    jsonRPCRequest({'method': method, 'gid': gid});
}

function printTaskDetails(gid) {
    jsonRPCRequest(
        {'method': 'aria2.tellStatus', 'gid': gid},
        (result) => {
            taskManager = setInterval(() => refreshTaskDetails(result.gid), 1000);
            printTaskName(result);
            printTaskOption(result.gid);
            var decimal = result.files.length.toString().length;
            var taskFiles = result.files.map(item => item = '<tr><td>'
            +           multiDecimalNumber(item.index, decimal) + '</td><td title="' + item.path.replace(/\//g, '\\') + '"'
            +           (result.files[0].uris.length > 0 ? ' uri="' + result.files[0].uris[0].uri + '">' : '>')
            +           item.path.split('/').pop() + '</td><td>'
            +           bytesToFileSize(item.length) + '</td><td>'
            +           ((item.completedLength / item.length * 10000 | 0) / 100).toString() + '%</td></tr>'
            );
            $('#taskFiles').html('<table>' + taskFiles.join('') + '</table>').find('td:nth-child(2)').on('click', (event) => {
                var uri = $(event.target).attr('uri');
                if (uri) {
                    navigator.clipboard.writeText(uri);
                    showNotification(window['warn_url_copied'], uri);
                }
            });
        }
    );

    function refreshTaskDetails(gid) {
        jsonRPCRequest(
            {'method': 'aria2.tellStatus', 'gid': gid},
            (result) => {
                printTaskName(result);
                var completeRatio = result.files.map(item => ((item.completedLength / item.length * 10000 | 0) / 100).toString() + '%');
                $('#taskFiles').find('td:nth-child(4)').each((index, element) => $(element).html(completeRatio[index]));
            }
        );
    }

    function printTaskName(result) {
        var taskUrl = result.files[0].uris.length > 0 ? result.files[0].uris[0].uri : '';
        var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
        $('#taskName').html('<div class="button ' + result.status + '">' + taskName + '</div>');
        var bittorrent = Object.keys(result).includes('bittorrent');
        var complete = result.status === 'complete';
        $('#optionDownload').attr({'gid': result.gid, 'disabled': complete});
        $('#optionUpload').attr({'gid': result.gid, 'disabled': !bittorrent || complete});
        $('#optionProxy').attr({'gid': result.gid, 'disabled': bittorrent || complete});
    }
}

function printTaskOption(gid) {
    jsonRPCRequest(
        {'method': 'aria2.getOption', 'gid': gid},
        (result) => {
            $('#optionDownload').val(result['max-download-limit']);
            $('#optionUpload').val(result['max-upload-limit']);
            $('#optionProxy').val(result['all-proxy'] || '');
        }
    );
}

function retryTask(gid) {
    jsonRPCRequest([
            {'method': 'aria2.getFiles', 'gid': gid},
            {'method': 'aria2.getOption', 'gid': gid}
        ],
        (result, options) => {
            showNotification('Caution', 'This function is not available at this moment');
            // https://github.com/ziahamza/webui-aria2/blob/dddf776a18b095ac373a22b28135c5dd6858496b/docs/app.js#L1989
            // Wait for porting
        }
    );
}

$('#taskName').on('click', (event) => {
    clearInterval(taskManager);
    $('#taskName, #taskFiles').empty();
    $('#taskDetails').hide();
});

$('#optionDownload, #optionUpload, #optionProxy').on('change', (event) => {
    var gid = $(event.target).attr('gid');
    var value = event.target.value;
    if (event.target.id === 'optionDownload') {
        var options = {'max-download-limit': value};
    }
    else if (event.target.id === 'optionUpload') {
        options = {'max-upload-limit': value};
    }
    else if (event.target.id === 'optionProxy') {
        options = {'all-proxy': value};
    }
    jsonRPCRequest({'method': 'aria2.changeOption', 'gid': gid, 'options': options}, () => printTaskOption(gid));
});

var taskManager;
