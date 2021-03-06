var menuTabs = [
    {button: 'tabBasic', queue: 'menuBasic'},
    {button: 'tabAdvanced', queue: 'menuAdvanced'},
    {button: 'tabDownload', queue: 'menuDownload'}
];
menuTabs.forEach(active => {
    document.getElementById(active.button).addEventListener('click', (event) => {
        document.getElementById(active.button).classList.add('checked');
        document.getElementById(active.queue).style.display = 'block';
        menuTabs.forEach(item => { if (item.queue !== active.queue) {document.getElementById(item.queue).style.display = 'none'; document.getElementById(item.button).classList.remove('checked');} });
    });
});

document.getElementById('export').addEventListener('click', (event) => {
    var blob = new Blob([JSON.stringify(localStorage)], {type: 'application/json; charset=utf-8'});
    var saver = document.getElementById('saver');
    saver.href = URL.createObjectURL(blob);
    saver.download = 'downwitharia2_options-' + new Date().toLocaleString('ja').replace(/[\/\s:]/g, '_') + '.json';
    saver.click();
});

document.getElementById('import').addEventListener('click', (event) => document.getElementById('reader').click());

document.getElementById('reader').addEventListener('change', (event) => {
    var reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    reader.onload = () => {
        restoreSettings(reader.result, false);
        location.reload();
    };
});

[
    'jsonrpc',
    'token',
    'useragent',
    'allproxy',
    'proxied',
    'capture',
    'sizeEntry',
    'sizeUnit',
    'fileExt',
    'monitored',
    'ignored'
].forEach(id => {
    var menu = document.getElementById(id);
    menu.value = localStorage[id];
    menu.addEventListener('change', (event) => { localStorage[id] = event.target.value; });
});

document.getElementById('verify').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.getVersion'},
        (result) => {
            showNotification(chrome.i18n.getMessage('warn_aria2_version'), result.version);
        },
        (error, rpc) => {
            showNotification(error, rpc);
        }
    );
});

document.getElementById('insight').addEventListener('click', (event) => {
    if (event.target.classList.contains('checked')) {
        document.getElementById('token').setAttribute('type', 'password');
    }
    else {
        document.getElementById('token').setAttribute('type', 'text');
    }
    event.target.classList.toggle('checked');
});

document.getElementById('capture').addEventListener('change', captureFilters);
captureFilters();

document.getElementById('sizeEntry').addEventListener('change', calcFileSize);

document.getElementById('sizeUnit').addEventListener('change', calcFileSize);

function captureFilters() {
    if (localStorage['capture'] === '1') {
        document.getElementById('captureFilters').style.display = 'block';
    }
    else {
        document.getElementById('captureFilters').style.display = 'none';
    }
}

function calcFileSize() {
    var number = localStorage['sizeEntry'] | 0;
    var unit = localStorage['sizeUnit'] | 0;
    localStorage['fileSize'] = number * 1024 ** unit;
}
