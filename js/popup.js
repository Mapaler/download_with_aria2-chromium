var taskTabs = ['active_btn', 'waiting_btn', 'stopped_btn'];
var taskQueues = ['allTaskQueue', 'activeQueue', 'waitingQueue', 'stoppedQueue'];
taskTabs.forEach(item => document.getElementById(item).addEventListener('click', toggleTaskQueue));

function toggleTaskQueue(event) {
    var active = event.target.id;
    var activeQueue = active.replace('_btn', 'Queue');
    if (event.target.classList.contains('checked')) {
        document.getElementById('allTaskQueue').style.display = 'block';
        document.getElementById(activeQueue).style.display = 'none';
    }
    else {
        document.getElementById(activeQueue).style.display = 'block';
        taskTabs.forEach(item => { if (item !== active) document.getElementById(item).classList.remove('checked'); });
        taskQueues.forEach(item => { if (item !== activeQueue) document.getElementById(item).style.display = 'none'; });
    }
    event.target.classList.toggle('checked');
}

var modules = [
    {'id': 'newTask_btn', 'win': 'newTaskWindow', 'name': 'newTask'}, 
    {'id': 'options_btn', 'win': 'optionsWindow', 'name': 'options'}
];
modules.forEach(item => initialModules(item));

function initialModules(module) {
    var module_btn = document.getElementById(module.id);
    var module_win;
    module_btn.addEventListener('click', (event) => {
        if (event.target.classList.contains('checked')) {
            module_win.remove();
        }
        else {
            module_win = document.createElement('iframe');
            module_win.id = module.win;
            module_win.src = '/modules/' + module.name + '/index.html';
            document.querySelector('body').appendChild(module_win);
        }
        event.target.classList.toggle('checked');
    });
}

document.getElementById('purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest({'method': 'aria2.purgeDownloadResult'});
});

window.addEventListener('message', (event) => {
    document.getElementById(event.data).remove();
});

function printMainFrame() {
    jsonRPCRequest(
        {'method': 'aria2.getGlobalStat'},
        (result) => {
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var active = (result.numActive | 0);
            var waiting = (result.numWaiting | 0);
            var stopped = (result.numStopped | 0);
            printTaskQueue(waiting, stopped);
            document.getElementById('numActive').innerHTML = active;
            document.getElementById('numWaiting').innerHTML = waiting;
            document.getElementById('numStopped').innerHTML = stopped;
            document.getElementById('downloadSpeed').innerHTML = downloadSpeed;
            document.getElementById('uploadSpeed').innerHTML = uploadSpeed;
            document.getElementById('queueTabs').style.display = 'block';
            document.getElementById('menuTop').style.display = 'block';
            document.getElementById('networkStatus').style.display = 'none';
        }, (error, rpc) => {
            document.getElementById('queueTabs').style.display = 'none';
            document.getElementById('menuTop').style.display = 'none';
            document.getElementById('networkStatus').innerHTML = error;
            document.getElementById('networkStatus').style.display = 'block';
        }
    );

    function printTaskQueue(globalWaiting, globalStopped) {
        jsonRPCRequest([
            {'method': 'aria2.tellActive'},
            {'method': 'aria2.tellWaiting', 'index': [0, globalWaiting]},
            {'method': 'aria2.tellStopped', 'index': [0, globalStopped]},
        ], (activeQueue, waitingQueue, stoppedQueue) => {
            var active = activeQueue ? activeQueue.map(item => printTaskInfo(item)) : [];
            var waiting = waitingQueue ? waitingQueue.map(item => printTaskInfo(item)) : [];
            var stopped = stoppedQueue ? stoppedQueue.map(item => printTaskInfo(item)) : [];
            document.getElementById('allTaskQueue').innerHTML = [...active, ...waiting, ...stopped].join('');
            document.getElementById('activeQueue').innerHTML = active.join('');
            document.getElementById('waitingQueue').innerHTML = waiting.join('');
            document.getElementById('stoppedQueue').innerHTML = stopped.join('');
        });
    }

    function printTaskInfo(result) {
        var downloadSpeed = bytesToFileSize(result.downloadSpeed);
        var totalLength = bytesToFileSize(result.totalLength);
        var completedLength = bytesToFileSize(result.completedLength);
        var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
        var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100).toString() + '%';
        var taskUrl = !result.bittorrent ? result.files[0].uris[0].uri : '';
        var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
        var connections = result.bittorrent ? result.numSeeders + ' (' + result.connections + ')' : result.connections;
        var uploadSpeed = result.bittorrent ? '⏫ ' + bytesToFileSize(result.uploadSpeed) + '/s' : '';
        var retryButton = !result.bittorrent && ['error', 'removed'].includes(result.status) ? '<span id="retry_btn" class="button">🌌</span>' : '';
        return  '<div class="taskInfo" gid="' + result.gid + '" status="' + result.status + '">'
        +           '<div class="taskBody">'
        +               '<div class="title">' + taskName + '</div>'
        +               '<div><span>🖥️ ' + completedLength + '</span><span>⏲️ ' + estimatedTime + '</span><span>📦 ' + totalLength + '</span></div>'
        +               '<div><span>📶 ' + connections + '</span><span>⏬ ' + downloadSpeed + '/s</span><span>' + uploadSpeed + '</span></div>'
        +           '</div>'
        +           '<div class="taskMenu"><span id="remove_btn" class="button">❌</span><span id="invest_btn" class="button">🔍</span>' + retryButton + '</div>'
        +           '<div id="progress_btn" class="fancybar ' + result.status + 'Bar"><span id="progress_btn" class="' + result.status + '" style="width: ' + completeRatio + '">' + completeRatio + '</span></div>'
        +       '</div>'
    }
}

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
