/* Lampa Rating Tools v0.1.3 — independent companion for Rate.js.
 * Tests run only on request. API key is read locally, sent only to the selected Kinopoisk API endpoint.
 * Cache operations are limited to the two known KP/IMDb stores. No third-party code copied.
 */
(function ratingTools(window) {
    'use strict';
    var VERSION = '0.1.3';
    var URL = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/301';
    var CACHE_KEYS = ['rating_cache_kp_rating', 'kp_rating'];
    var ID = 'pukhov_rating_tools';
    var busy = false, lastRefresh = 0, attempts = 0;
    function boot() {
        if (window.__pukhovRatingTools) return;
        var L = window.Lampa;
        if (!L || !window.appready || !L.SettingsApi || !L.Storage || !L.Modal || !window.$) {
            if (++attempts < 120) window.setTimeout(boot, 500);
            return;
        }
        var $ = window.$;
        function key() {
            return String(L.Storage.get('rating_kp_api_key', '') || L.Storage.get('source_api_key', '') || '').trim();
        }
        function isMap(value) {
            return value !== null && typeof value === 'object' && !Array.isArray(value);
        }
        function valid(value) {
            var n = Number(value);
            return isFinite(n) && n > 0 && n <= 10;
        }
        function ratingRecord(value) {
            return isMap(value) && (Object.prototype.hasOwnProperty.call(value, 'kp') || Object.prototype.hasOwnProperty.call(value, 'imdb'));
        }
        function emptyRecord(value) {
            return ratingRecord(value) && !valid(value.kp) && !valid(value.imdb);
        }
        function maps() {
            return CACHE_KEYS.map(function (name) {
                var value = L.Storage.get(name, '');
                return {name: name, value: isMap(value) ? value : null};
            });
        }
        function activeController() {
            return L.Controller && typeof L.Controller.enabled === 'function' ? L.Controller.enabled() : null;
        }
        function sameController(a, b) {
            return !!(a && b && a.name === b.name && (!a.controller || !b.controller || a.controller === b.controller));
        }
        function ratingSettingsActive(start) {
            var current = activeController();
            return sameController(start, current) && current.name === 'settings_component' &&
                !!window.document.querySelector('[data-name="' + ID + '_api"]');
        }
        function dialog(title, lines, confirmed) {
            var previous = activeController();
            var returnTo = previous && previous.name === 'settings' ? 'settings' : 'settings_component';
            var closed = false;
            var wrap = $('<div></div>').css({lineHeight:'1.5', padding:'0.4em'});
            lines.forEach(function (line) {
                wrap.append($('<div></div>').css({marginBottom:'0.55em'}).text(line));
            });
            function dismiss(next) {
                if (closed) return;
                closed = true;
                L.Modal.close();
                // Lampa's modal close does not necessarily restore the settings controller.
                // Restore before opening a follow-up dialog, not on a delayed global timer.
                var current = activeController();
                if (L.Controller && typeof L.Controller.toggle === 'function' &&
                    (!current || !current.name || current.name === 'modal')) {
                    L.Controller.toggle(returnTo);
                }
                if (typeof next === 'function') next();
            }
            function close() { dismiss(); }
            var buttons = confirmed ? [
                {name:'Отмена', onSelect:close},
                {name:'Подтвердить', onSelect:function () { dismiss(confirmed); }}
            ] : [{name:'Закрыть', onSelect:close}];
            L.Modal.open({title:title,html:wrap,size:'medium',buttons:buttons,onBack:close});
        }
        function notify(message) {
            if (L.Noty && typeof L.Noty.show === 'function') L.Noty.show(message);
        }
        function showStats() {
            var lines = [];
            maps().forEach(function (entry, index) {
                var stats = {total:0,good:0,empty:0,other:0};
                if (entry.value) Object.keys(entry.value).forEach(function (id) {
                    var item = entry.value[id]; stats.total++;
                    if (ratingRecord(item) && (valid(item.kp) || valid(item.imdb))) stats.good++;
                    else if (emptyRecord(item)) stats.empty++;
                    else stats.other++;
                });
                lines.push((index === 0 ? 'Кэш Rate.js' : 'Совместимый (старый) кэш') + ': ' +
                    stats.total + ' записей; с оценками: ' + stats.good +
                    '; пустых: ' + stats.empty + '; прочих: ' + stats.other);
            });
            lines.push('Записи в двух хранилищах могут дублироваться. Это не число уникальных фильмов.');
            lines.push('API-ключ: ' + (key() ? 'задан' : 'не задан') +
                '. Функция обновления Rate.js: ' + (typeof window.refreshAllRatings === 'function' ? 'найдена' : 'не найдена') + '.');
            dialog('Статистика кэша', lines);
        }
        function purge(all) {
            try {
                var entries = maps(), removed = 0, visited = [], changed = [];
                entries.forEach(function (entry) {
                    if (!entry.value) return;
                    if (visited.indexOf(entry.value) === -1) {
                        visited.push(entry.value);
                        var n = 0;
                        Object.keys(entry.value).forEach(function (id) {
                            if (all || emptyRecord(entry.value[id])) {
                                delete entry.value[id];
                                n++;
                            }
                        });
                        removed += n;
                        if (n) changed.push(entry.value);
                    }
                });
                // Keep object identities so Rate.js can keep its live references.
                // Only the two known rating stores are touched.
                entries.forEach(function (entry) {
                    if (entry.value && changed.indexOf(entry.value) !== -1)
                        L.Storage.set(entry.name, entry.value, true);
                });
                dialog('Очистка кэша', [
                    'Удалено записей: ' + removed + '.',
                    'Остальные настройки, API-ключ, история просмотров и Keyboard Fix не затронуты.',
                    'Полностью перезапустите Lampa перед проверкой: активные запросы Rate.js могут снова записать результаты.'
                ]);
            } catch (e) {
                dialog('Ошибка очистки', ['Не удалось полностью обновить кэш. Проверьте статистику.']);
            }
        }
        function askPurge(all) {
            dialog(all ? 'Очистить кэш КиноПоиска и IMDb?' : 'Очистить пустые рейтинги?', [
                all ? 'Будут удалены все записи из двух известных хранилищ оценок КиноПоиска и IMDb.' :
                    'Будут удалены только записи, в которых нет ни одной положительной оценки КиноПоиска или IMDb. Успешные оценки сохранятся.',
                'После очистки полностью перезапустите Lampa. Повторное получение оценок расходует лимит API.'
            ], function () { purge(all); });
        }
        function explain(status, kind) {
            if (status === 200) return 'Сервер ответил успешно.';
            if (status === 401) return 'Ключ отклонён сервером.';
            if (status === 402) return 'Лимит запросов исчерпан.';
            if (status === 403) return 'Доступ запрещён сервером.';
            if (status === 429) return 'Превышена частота запросов.';
            if (kind === 'timeout') return 'Истекло время ожидания ответа.';
            if (kind === 'invalid') return 'Получен ответ, но в нём нет ожидаемых данных фильма.';
            if (!status) return 'HTTP-ответ недоступен. Возможны CORS, DNS, TLS, сеть или блокировка. Точную причину этот тест не различает.';
            return 'Сервер вернул ошибку.';
        }
        function testApi(useLampa) {
            if (busy) { notify('Проверка уже выполняется'); return; }
            var apiKey = key();
            if (!apiKey) {
                dialog('API-ключ не задан', ['Введите ключ в настройках Rate.js.']);
                return;
            }
            if (useLampa && typeof L.Reguest !== 'function') {
                dialog('Диагностика', ['Сетевой модуль Lampa.Reguest недоступен.']);
                return;
            }
            busy = true;
            var started = Date.now(), done = false, request, timer, xhr;
            var startedIn = activeController();
            notify('Rating Tools: выполняется один запрос к API');
            function finish(status, kind, body) {
                if (done) return;
                done = true; busy = false;
                if (timer != null) window.clearTimeout(timer);
                apiKey = '';
                status = Number(status) || 0;
                var lines = [
                    'Способ: ' + (useLampa ? 'Lampa.Reguest (5 с)' : 'XMLHttpRequest (15 с)'),
                    'HTTP: ' + (useLampa && status === 200 ? 'успешный ответ (точный код не передан)' : (status || 'нет доступного кода')),
                    'Время: ' + Math.max(0, Date.now() - started) + ' мс.',
                    explain(status, kind)
                ];
                if (status === 200) {
                    var kp = body && valid(body.ratingKinopoisk) ? Number(body.ratingKinopoisk).toFixed(1) : 'нет';
                    var imdb = body && valid(body.ratingImdb) ? Number(body.ratingImdb).toFixed(1) : 'нет';
                    lines.push('Тест: Матрица (ID 301). КиноПоиск: ' + kp + '; IMDb: ' + imdb + '.');
                    if (!body || Number(body.kinopoiskId) !== 301) lines.push('Ответ не содержит ожидаемый ID фильма; проверьте иные сетевые модули.');
                }
                lines.push('Ключ не выводится. Тест не изменяет кэш рейтингов.');
                // Avoid interrupting another dialog if the user has left settings.
                lastResult = lines;
                if (ratingSettingsActive(startedIn)) {
                    dialog('Результат проверки API', lines);
                } else {
                    notify('Rating Tools: тест завершён. Результат в разделе «Последний тест».');
                }
            }
            try {
                if (useLampa) {
                    request = new L.Reguest();
                    timer = window.setTimeout(function () {
                        finish(0, 'timeout');
                        try { request.clear(); } catch (ignore) {}
                    }, 8000);
                    request.timeout(5000);
                    request.silent(URL, function (data) {
                        // The public Lampa callback provides parsed data, not the raw HTTP status.
                        if (data && Number(data.kinopoiskId) === 301) finish(200, 'ok', data);
                        else finish(0, 'invalid');
                    }, function (err, exception) {
                        var status = err && err.status;
                        finish(status, typeof exception === 'string' && exception === 'timeout' ? 'timeout' : 'error');
                    }, false, {headers:{'X-API-KEY':apiKey}});
                } else {
                    xhr = new window.XMLHttpRequest();
                    xhr.open('GET', URL, true);
                    xhr.timeout = 15000;
                    xhr.setRequestHeader('X-API-KEY', apiKey);
                    xhr.setRequestHeader('Accept', 'application/json');
                    xhr.onload = function () {
                        var data = null;
                        if (xhr.status === 200) {
                            try { data = JSON.parse(xhr.responseText); } catch (ignore) {}
                        }
                        finish(xhr.status, 'load', data);
                    };
                    xhr.onerror = function () { finish(0, 'error'); };
                    xhr.ontimeout = function () { finish(0, 'timeout'); };
                    xhr.onabort = function () { finish(0, 'error'); };
                    xhr.send();
                }
            } catch (e) { finish(0, 'error'); }
        }
        var lastResult = null;
        function refresh() {
            if (typeof window.refreshAllRatings !== 'function') {
                dialog('Обновление', ['Функция Rate.js не найдена. Проверьте, что Rate.js включён и приложение перезапущено.']);
                return;
            }
            dialog('Обновить рейтинги?', [
                'Будет вызвана штатная функция Rate.js для уже загруженных карточек.',
                'Может использовать несколько запросов из дневного лимита. Кэш не очищается автоматически.'
            ], function () {
                var now = Date.now();
                if (lastRefresh && now - lastRefresh < 15000) { notify('Повторное обновление доступно через 15 секунд'); return; }
                lastRefresh = now;
                try {
                    var nodes = window.document.querySelectorAll('.card__vote-line[data-kp-requested]');
                    for (var i = 0; i < nodes.length; i++) nodes[i].removeAttribute('data-kp-requested');
                    window.refreshAllRatings();
                    notify('Rating Tools: запрос обновления передан Rate.js');
                } catch (e) { notify('Rating Tools: ошибка обновления'); }
            });
        }
        function add(name, title, description, action) {
            L.SettingsApi.addParam({
                component:ID, param:{name:ID+'_'+name,type:'button'},
                field:{name:title,description:description},onChange:action
            });
        }
        // Real Lampa API access also identifies this as a Lampa extension.
        window.Lampa.SettingsApi.addComponent({
            component:ID,name:'Rating Tools v' + VERSION,
            icon:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v18h18M7 16l4-5 4 3 5-7"/><circle cx="20" cy="7" r="1.5"/></svg>'
        });
        add('api','Проверить API-ключ','Один прямой запрос с приставки; ключ не выводится.',function(){testApi(false);});
        add('network','Диагностика подключения Rate.js','Один запрос через Lampa.Reguest, как в Rate.js.',function(){testApi(true);});
        add('last','Последний тест','Показать результат без нового запроса.',function(){dialog('Последний тест',lastResult || ['Тест ещё не выполнялся.']);});
        add('stats','Статистика кэша','Сохранённые, пустые и прочие записи КиноПоиска/IMDb.',showStats);
        add('empty','Очистить пустые рейтинги','Сохранить записи с успешно полученными оценками.',function(){askPurge(false);});
        add('clear','Очистить кэш рейтингов','Только известные хранилища КиноПоиска/IMDb.',function(){askPurge(true);});
        add('refresh','Обновить рейтинги','Вызвать штатную функцию Rate.js.',refresh);
        (function diagnostics(L,window,dialog,notify,activeController,ratingSettingsActive,valid,add){
    var trace=null,running=false,result=null;
    function num(v){if(typeof v==='string')v=v.replace(',','.').trim();return valid(v)?Number(v):null;}
    function ratings(d){d=d||{};return {kp:num(d.kp_rating)||num(d.ratingKinopoisk)||num(d.rating&&d.rating.kp),imdb:num(d.imdb_rating)||num(d.ratingImdb)||num(d.rating&&d.rating.imdb)};}
    function fmt(r){return 'КП: '+(r&&r.kp!=null?r.kp:'нет')+'; IMDb: '+(r&&r.imdb!=null?r.imdb:'нет');}
    function id(d){var s=String(d&&d.id||'');return /^\d{1,12}$/.test(s)&&Number(s)>0?s:'';}
    function type(d,o){var t=o&&o.method||d&&d.media_type;if(t==='tv'||t==='movie')return t;if(d&&(d.first_air_date||d.original_name||d.name&&!d.title))return 'tv';return d&&(d.release_date||d.original_title||d.title)?'movie':'';}
    function safeSource(s){return typeof s==='string'&&/^[a-zA-Z0-9_-]{1,25}$/.test(s)?s:'не указан';}
    function host(u){try{var p=new window.URL(u,window.location.href);return /^https?:$/.test(p.protocol)?p.hostname:'не HTTP';}catch(e){return 'не определён';}}
    function recording(){return trace&&!trace.stopped&&Date.now()-trace.started<120000;}
    function response(e){
    if(!recording()||!e||!e.params||!e.data)return;
    try {
        var root=e.data,d=root.movie||root.data||root,r=ratings(d),u=String(e.params.url||''),m=u.match(/\/(movie|tv)\/(\d+)(?:[?#]|$)/);
        var endpoint=/\/KPrating(?:[/?#]|$)/i.test(u),h=host(u),post=e.params.post_data,posted=post&&typeof post==='object'?String(post.card_id||post.tmdb_id||''):'';
        var matchId=/^\d{1,12}$/.test(posted)?posted:m?m[2]:endpoint||/(^|\.)lampa\.stream$/i.test(h)?'':id(d);
        if(!(r.kp||r.imdb||endpoint||m&&m[2]===id(d)))return;
        if(!matchId&&!trace.movie)return;
        if(trace.responses.length>=100)trace.responses.shift();
        trace.responses.push({id:matchId,type:m?m[1]:'',host:h,endpoint:endpoint?'/KPrating':'',r:r,at:Date.now()});
    }catch(ignore){}
}
    function sampleDom(item){
    if(!item||!item.body||typeof item.body.find!=='function')return;
    try{
        function dom(selector){return num(item.body.find(selector+':not(.hide)').first().find('div').first().text());}
        var r={kp:dom('.rate--kp'),imdb:dom('.rate--imdb')};
        if(r.kp||r.imdb)item.dom=r;
    }catch(ignore){}
}
    function resourceHosts(){
    var list=[],seen=Object.create(null);
    try{
        if(!window.performance||!window.performance.getEntriesByType)return list;
        window.performance.getEntriesByType('resource').forEach(function(e){
            if(e.startTime<trace.perfStart)return;
            var u=String(e.name||''),h=host(u),ep=/\/KPrating(?:[/?#]|$)/i.test(u);
            if(!ep&&!/(^|\.)(lampa\.stream|rating\.kinopoisk\.ru|kinopoiskapiunofficial\.tech|poiskkino\.dev)$/i.test(h))return;
            var label=h+(ep?'/KPrating':'');
            if(!seen[label]){seen[label]=true;list.push(label);}
        });
    }catch(ignore){}
    return list.slice(-5);
}
    function full(e){
        if(!recording()||!e||['start','complite','complete'].indexOf(e.type)<0)return;
        try{
            var o=e.object||{},d=e.data&&e.data.movie||o.card,i=id(d),t=type(d,o);
            if(!i||!t)return;
            var prev=trace.movie,item={id:i,type:t,source:safeSource(d.source||o.source),title:String(d.title||d.name||'Без названия').slice(0,80),r:ratings(d),dom:null};
            if(prev&&prev.id===i&&prev.type===t){item.dom=prev.dom;item.body=prev.body;item.openedAt=prev.openedAt;}
            else item.openedAt=Date.now();
            if(e.body&&typeof e.body.find==='function')item.body=e.body;
            if(!item.body&&o.activity&&typeof o.activity.render==='function'){
                try{item.body=window.$(o.activity.render());}catch(ignore){}
            }
            trace.movie=item;
            sampleDom(item);
        }catch(ignore){}
    }
    var supported=L.Listener&&typeof L.Listener.follow==='function';
    if(supported){L.Listener.follow('request_secuses',response);L.Listener.follow('full',full);}
    function start(){
        if(!supported){dialog('Источник рейтингов',['События Lampa недоступны.']);return;}
        trace={started:Date.now(),stopped:false,responses:[],movie:null,perfStart:window.performance&&typeof window.performance.now==='function'?window.performance.now():0};result=null;
        dialog('Запись источника включена',['Закройте окно и настройки. Откройте один новый фильм и дождитесь появления оценок КП и IMDb.','Не выходя из фильма, откройте Rating Tools → «Отчёт об источнике». Запись ограничена двумя минутами.','Дополнительных запросов нет. Данные диагностики хранятся только в памяти.']);
    }
    function report(){
        if(!trace||!trace.movie){dialog('Отчёт об источнике',['Данных полной карточки пока нет. Включите запись и откройте фильм.']);return;}
        sampleDom(trace.movie);
        trace.stopped=true;
        var m=trace.movie,lines=[m.title+' · '+m.type+'/'+m.id+' · источник: '+m.source,'Данные полной карточки: '+fmt(m.r),'Отображение после загрузки: '+fmt(m.dom)];
        var seen=Object.create(null),hits=trace.responses.filter(function(x){return x.id===m.id&&(!x.type||x.type===m.type)||!x.id&&x.at>=m.openedAt;}).filter(function(x){var k=x.id+'|'+x.host+x.endpoint+'|'+fmt(x.r);if(seen[k])return false;seen[k]=true;return true;}).slice(-5);
        if(!hits.length)lines.push('Сетевой ответ не зафиксирован: возможен кэш или другой сетевой модуль.');
        hits.forEach(function(x){lines.push((x.id?'Ответ ':'Кандидат (без ID) ')+x.host+x.endpoint+': '+fmt(x.r));});
        var resources=resourceHosts();if(resources.length)lines.push('Сетевые ресурсы (без привязки к фильму): '+resources.join(', '));
        m.body=null;
        try{
            var cache=L.Storage.get('rating_cache_kp_rating',{})||{},rec=cache[m.id];
            lines.push('Кэш Rate.js: '+fmt(rec&&{kp:num(rec.kp),imdb:num(rec.imdb)}));
            var old=(L.Storage.get('kp_rating',{})||{})[m.id];lines.push('Старый кэш kp_rating: '+fmt(old&&{kp:num(old.kp),imdb:num(old.imdb)}));
            var cards=window.document.querySelectorAll('.card');
            for(var i=0;i<cards.length;i++){var d=cards[i].card_data;if(id(d)===m.id&&type(d)===m.type){lines.push('Данные постера: '+fmt(ratings(d)));break;}}
        }catch(ignore){}
        if(result)lines.push(result);
        lines.push('Имена серверов и известный путь KPrating; без ключей и параметров. Оценки не изменены.');
        dialog('Отчёт об источнике',lines);
    }
    function test(){
        if(running){notify('Запрос уже выполняется');return;}
        var m=trace&&trace.movie,api=L.Api&&L.Api.sources&&L.Api.sources.tmdb;
        if(!m){dialog('Проверка запроса Lampa',['Сначала включите запись и откройте фильм.']);return;}
        if(!api||typeof api.get!=='function'){dialog('Проверка запроса Lampa',['Штатный метод TMDB.get недоступен.']);return;}
        var before=activeController(),done=false,started=Date.now(),timer,originalTrace=trace;running=true;
        function finish(data,error){
            if(done)return;done=true;running=false;window.clearTimeout(timer);
            var same=data&&id(data)===m.id;
            var lines=[m.title+' · '+m.type+'/'+m.id,'Штатный запрос TMDB.get: '+(error|| (same?'получена карточка':'неожиданный ID или формат')),'Время: '+(Date.now()-started)+' мс.','Оценки: '+fmt(same?ratings(data):null),'В ранее открытой карточке: '+fmt(m.r)];
            if(trace!==originalTrace)return;
            result='Отдельный запрос: '+lines[1]+'; '+lines[3];
            if(ratingSettingsActive(before))dialog('Проверка запроса Lampa',lines);else notify('Проверка завершена. Результат в отчёте об источнике.');
        }
        notify('Проверка одного фильма через Lampa');
        timer=window.setTimeout(function(){finish(null,'таймаут');},15000);
        try{api.get(m.type+'/'+m.id+'?append_to_response=external_ids',{},function(d){finish(d,null);},function(){finish(null,'ошибка запроса');},false);}catch(e){finish(null,'метод завершился ошибкой');}
    }
    add('trace_start','Начать запись источника','Откройте фильм для диагностики без дополнительных запросов.',start);
    add('trace_report','Отчёт об источнике','Оценки из ответа сервера, полной карточки, постера и кэша.',report);
    add('trace_test','Проверить запрос Lampa','Один штатный запрос данных последнего записанного фильма.',test);
})(L, window, dialog, notify, activeController, ratingSettingsActive, valid, add);
        window.__pukhovRatingTools = VERSION;
    }
    boot();
})(window);
