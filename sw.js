const guuid = () => {

}
let cachelist = [];
const info = {
    version: "0.0.1-beta-19",
    dev: 0,
    domain: "dash.wexa.top",
    //endstatic: "static.wexa.top",
    //domain: "wexa.215213344.xyz",
    //endstatic: "static.215213344.xyz",
    https: 1
}
const CACHE_NAME = `Wexagonal@${info.version}`;
const DB_CACHE = "WexagonalDB"
self.addEventListener('activate', event => {
    event.waitUntil(
        self.clients.claim()
    );
})
self.addEventListener('install', async function (installEvent) {
    self.skipWaiting();
    installEvent.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(cachelist);
            })
    );
});
self.addEventListener('fetch', event => {
    try {
        event.respondWith(handle(event.request))
    } catch (e) {
        event.respondWith(handle_error(e))
    }
})
self.db = {
    read: (key) => {
        return new Promise((resolve, reject) => {
            caches.open(DB_CACHE).then(function (cache) {
                cache.match(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`)).then(function (res) {
                    res.text().then(text => resolve(text))
                }).catch(() => {
                    resolve(null)
                })
            })
        })
    },
    read_arrayBuffer: (key) => {
        return new Promise((resolve, reject) => {
            caches.open(DB_CACHE).then(function (cache) {
                cache.match(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`)).then(function (res) {
                    res.arrayBuffer().then(text => resolve(text))
                }).catch(() => {
                    resolve(null)
                })
            })
        })
    },
    write: (key, value) => {
        return new Promise((resolve, reject) => {
            caches.open(DB_CACHE).then(function (cache) {
                cache.put(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`), new Response(value)).then(function () {
                    resolve()
                })
            })
        })
    }
}

const endbuild = async (res) => {
    return new Response(res, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        }
    })
}

const end_fontawesome = async (path) => {
    return endstatic(('/assets/fonts/fontawesome/' + path.split('/').pop()).replace('//', '/'))

}
const endget = async (path) => {
    if (info.dev) {
        const geturl = 'https://' + info.endstatic + path
        return await (await fetch(geturl)).text()
    }
    return await (await endstatic(path)).text()
}

const endstatic = async (path) => {
    let end;
    if (info.dev) {
        end = [
            //'http://localhost:9104' + path,
            'https://' + info.endstatic + path
        ]
    } else {
        end = [
            `https://unpkg.com/wexagonal_front@${info.version}` + path,
        ]
    }
    const req = new Request('https://STATIC' + path)
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(req).then(function (res) {
            if (!!res && !!res.ok) {
                return res
            } else {
                return lfetch(end).then(resp => {
                    const respp = resp.clone()
                    cache.put(req, resp);
                    return respp
                })
            }
        })
    })
}

const endnpm = async (path) => {
    const end = [
        'https://unpkg.com' + path
    ]
    //return lfetch(end)
    //缓存
    const req = new Request('https://NPM' + path)
    return caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(req).then(function (res) {
            if (!!res && !!res.ok) {
                return res
            } else {
                return lfetch(end).then(resp => {
                    const respp = resp.clone()
                    cache.put(req, resp);
                    return respp
                })
            }
        }
        )
    })
}

const handle_error = async (e) => {
    return fetch('/error.html').then(res => res.text()).then(text => {
        return new Response(text.replace('{{ERROR}}', e), {
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        })
    })
}

const handle = async (req) => {
    try {
        self.end = await db.read('endpoint')
        self.end = self.end ? new URL((info.https ? 'https://' : "http://") + self.end + '/api') : null
        const urlObj = new URL(req.url);
        const urlStr = urlObj.pathname;
        const domain = urlObj.hostname;
        const path = urlObj.pathname;
        console.log(path)
        if (path === '/manifest.json') {
            return endstatic('/manifest.json')
        }
        const q = k => { return urlObj.searchParams.get(k) };

        if (domain === info.domain) {
            switch (q('page')) {
                case 'update':
                    if (q('action') === 'clear') {
                        caches.delete(CACHE_NAME).then(() => {
                            console.log('清除缓存成功')
                        })
                    }
                    return fetch('/update.html')
                case 'info':
                    return new Response(JSON.stringify({
                        ok: 1,
                        version: info.version,
                        dev: info.dev
                    }), {
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8'
                        }
                    })
                case 'api':

                    end.searchParams.set('token', await db.read('token'))
                    switch (q('action')) {
                        case 'social':
                            switch (q('type')) {
                                case 'add_friend':
                                    end.searchParams.set('type', 'social')
                                    return fetch(end, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            type: "SEND_FRIEND_REQUEST",
                                            data: {
                                                endpoint: q('endpoint')
                                            }
                                        })
                                    })
                                case 'accept_friend':
                                    end.searchParams.set('type', 'social')
                                    return fetch(end, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            type: "ACCEPT_FRIEND_REQUEST",
                                            data: {
                                                endpoint: q('endpoint')
                                            }
                                        })
                                    })
                                case 'reject_friend':
                                    end.searchParams.set('type', 'social')
                                    return fetch(end, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            type: "REJECT_FRIEND_REQUEST",
                                            data: {
                                                endpoint: q('endpoint')
                                            }
                                        })
                                    })

                                case 'delete_friend':
                                    end.searchParams.set('type', 'social')
                                    return fetch(end, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            type: "DELETE_FRIEND",
                                            data: {
                                                endpoint: q('endpoint')
                                            }
                                        })
                                    })

                            }
                        case 'log':
                            end.searchParams.set('action', 'log')
                            end.searchParams.set('type', 'wexa')
                            end.searchParams.set('nodata', '1')
                            //end.searchParams.set('start', (new Date().getTime() - 1000 * 60 * 60 * 24 * 5))
                            //end.searchParams.set('end',new Date().getTime())
                            return fetch(end)
                        case 'edit':
                            switch (q('type')) {
                                case 'upload':
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'upload')
                                    end.searchParams.set('path', q('path'))
                                    return fetch(end, {

                                        method: 'POST',
                                        body: await req.text()
                                    })
                                case 'download':
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'download')
                                    end.searchParams.set('path', q('path'))
                                    return fetch(end)
                                case 'delete':
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'delete')
                                    end.searchParams.set('path', q('path'))
                                    return fetch(end)
                                case 'move':
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'move')
                                    end.searchParams.set('path', q('path'))
                                    end.searchParams.set('newpath', q('newpath'))
                                    return fetch(end)

                            }
                        case 'ci':
                            switch (q('type')) {
                                case 'cancel':
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'cancel')
                                    return fetch(end)
                                case 'dispatch':
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'dispatch')
                                    return fetch(end)

                            }
                        case 'config':
                            switch (q('type')) {
                                case 'list':

                                    end.searchParams.set('type', 'config')
                                    end.searchParams.set('action', 'list')
                                    return fetch(end)
                                case 'upload':
                                    end.searchParams.set('type', 'config')
                                    end.searchParams.set('action', 'upload')
                                    end.searchParams.set('config', q('config'))
                                    return fetch(end)
                            }
                        case 'img':
                            switch (q('type')) {
                                case 'upload':

                                    end.searchParams.set('type', 'img')
                                    end.searchParams.set('action', 'config')
                                    res = ((await (await fetch(end)).json()))

                                    if (!res.ok) return { ok: 0 }
                                    res = res.data
                                    if (res.proxy) {
                                        const uploaded_file = await req.text()
                                        end.searchParams.set('type', 'img')
                                        end.searchParams.set('action', 'upload')
                                        res = ((await (await fetch(end.href, {
                                            method: 'POST',
                                            body: uploaded_file
                                        })).json()).data)
                                        return new Response(JSON.stringify(
                                            {
                                                ok: 1,
                                                data: res
                                            }

                                        ), {
                                            headers: {
                                                'Content-Type': 'application/json'
                                            }
                                        })
                                    } else {
                                        const formData = new FormData()
                                        formData.append(imgConfig.fieldName, Base64toBlob(req.body), `${new Date().getTime()}.jpg`)
                                        return gres({
                                            ok: 1,
                                            data: await (async () => {
                                                const download_res = await (await fetch(imgConfig.url, {
                                                    method: 'POST',
                                                    body: formData,
                                                    headers: {
                                                        ...imgConfig.headers
                                                    }
                                                })).json()
                                                for (var q in imgConfig.path) {

                                                    const path_list = imgConfig.path[q].split('.')

                                                    const returnner = (array, path_list) => {
                                                        if (path_list.length == 0) return array
                                                        const path = path_list.shift()
                                                        if (!array[path]) return ''
                                                        return returnner(array[path], path_list)
                                                    }
                                                    const returnres = returnner(download_res, path_list)
                                                    if (returnres == '') continue
                                                    if (!!imgConfig.beautify) return imgConfig.beautify.replace(/\$\{\}/g, returnres)
                                                    return returnres
                                                }
                                                return 'ERROR,the path is not correct'
                                            })()
                                        })

                                    }
                                case 'delete':
                                    end.searchParams.set('type', 'img')
                                    end.searchParams.set('action', 'delete')
                                    end.searchParams.set('url', q('url'))
                                    return fetch(end)
                            }
                        case 'logout':
                            await db.write('token', '')
                            return Response.redirect('/dash')
                    }
                case 'sign':
                    end.searchParams.set('type', 'sign')
                    if (!q('username') || !q('password')) return Response.redirect(`/dash?page=login&error=1`)
                    end.searchParams.set('username', q('username'))
                    end.searchParams.set('password', q('password'))
                    res = await (await fetch(end)).json()
                    if (!res.ok) return Response.redirect(`/dash?page=login&error=1`)
                    await db.write('token', res.data)
                    return Response.redirect('/dash?page=dash')
                case 'dash':
                    end.searchParams.set('token', await db.read('token'))
                    switch (q('type')) {
                        case 'img':
                            end.searchParams.set('type', 'img')
                            end.searchParams.set('action', 'list')
                            res = ((await (await fetch(end)).json()))
                            if (!res.ok) return Response.redirect(`/dash?page=login&error=1`)
                            res = res.data
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/img.html'))
                                .replace('<!--API_IMG_LIST-->', (() => {
                                    let imglisthtml = ''
                                    for (var i in res.data) {
                                        imglisthtml +=
                                            `
                                    <div class="col-lg-4 col-md-12" >
                                        <div class="card shadow-lg mb-4" >
                                            <div class="card-header p-0 mx-3 mt-3 position-relative z-index-1" name="img_container">
                                                <div class="d-block" data-src="${res.data[i].url}"
                                                data-sub-html="<h4>${res.data[i].url.split('/').pop()}</h4> <p>在${new Date(res.data[i].time).toLocaleString()}上传</p>">
                                                    <img src="https://unpkg.com/chenyfan-oss@1.0.0/pic/lazy.gif" data-src="${res.data[i].url}"
                                                        alt="alt-article-15" class="img-fluid shadow rounded-3">
                                                </div>
                                            </div>
                                            <div class="card-body min-height-200 d-flex flex-column justify-content-between">
                                                <div>
                                                    <h6>${res.data[i].url.split('/').pop()}</h6>
                                                    <p class="text-secondary text-sm mb-0 min-height-50">在${new Date(res.data[i].time).toLocaleString()}上传</p>
                                                </div>
                                                <div class="d-flex justify-content-between">
                                                    <a href="javascript:globalcopy('${res.data[i].url}')"><svg t="1648008616118" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2252" width="24" height="24"><path d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16 16 0 0 1-16-16v-608a16 16 0 0 1 16-16h544a16 16 0 0 1 16 16v608z" p-id="2253"></path><path d="M848 64h-544a32 32 0 0 0 0 64h544a16 16 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z" p-id="2254"></path><path d="M608 360H288a32 32 0 0 0 0 64h320a32 32 0 1 0 0-64zM608 520H288a32 32 0 1 0 0 64h320a32 32 0 1 0 0-64zM480 678.656H288a32 32 0 1 0 0 64h192a32 32 0 1 0 0-64z" p-id="2255"></path></svg>复制网址</a>
                                                    <a href="javascript:globaldelete('${res.data[i].url}')" style="color:#d81e06"><svg t="1648008650160" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3154" width="24" height="24"><path d="M909.050991 169.476903l-217.554898 0 0-31.346939c0-39.5866-32.205493-71.792093-71.793116-71.792093L408.15591 66.337871c-39.5866 0-71.792093 32.205493-71.792093 71.792093l0 31.346939L113.349581 169.476903c-11.013845 0-19.942191 8.940626-19.942191 19.954471s8.928347 19.954471 19.942191 19.954471l84.264149 0 0 640.687918c0 60.479443 49.203632 109.683075 109.683075 109.683075l416.474366 0c60.479443 0 109.683075-49.203632 109.683075-109.683075L833.454246 209.385844l75.595722 0c11.012821 0 19.942191-8.940626 19.942191-19.954471S920.063813 169.476903 909.050991 169.476903zM376.2482 138.130987c0-17.593703 14.314007-31.907711 31.907711-31.907711l211.547067 0c17.593703 0 31.907711 14.314007 31.907711 31.907711l0 31.346939L376.2482 169.477926 376.2482 138.130987zM793.569864 850.074785c0 38.486546-31.312146 69.798692-69.798692 69.798692L307.297828 919.873478c-38.486546 0-69.798692-31.312146-69.798692-69.798692L237.499136 211.042577l556.070728 0L793.569864 850.074785z" p-id="3155" fill="#d81e06"></path><path d="M510.662539 861.276918c11.012821 0 19.954471-8.92937 19.954471-19.942191L530.61701 294.912753c0-11.013845-8.94165-19.942191-19.954471-19.942191s-19.954471 8.928347-19.954471 19.942191L490.708068 841.334727C490.708068 852.347548 499.649717 861.276918 510.662539 861.276918z" p-id="3156" fill="#d81e06"></path><path d="M374.562814 801.449321c11.012821 0 19.954471-8.92937 19.954471-19.942191L394.517285 354.74035c0-11.013845-8.94165-19.942191-19.954471-19.942191s-19.954471 8.928347-19.954471 19.942191l0 426.76678C354.608344 792.519951 363.549993 801.449321 374.562814 801.449321z" p-id="3157" fill="#d81e06"></path><path d="M649.832182 801.449321c11.012821 0 19.954471-8.92937 19.954471-19.942191L669.786653 354.74035c0-11.013845-8.94165-19.942191-19.954471-19.942191s-19.954471 8.928347-19.954471 19.942191l0 426.76678C629.877711 792.519951 638.81936 801.449321 649.832182 801.449321z" p-id="3158" fill="#d81e06"></path></svg>删除图片</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    `
                                    }
                                    return imglisthtml
                                })())
                                .replace('{{API_LIST_COUNT}}', Object.keys(res.data).length)
                            )

                        case 'file':
                            if (!q('path')) return Response.redirect('/dash?page=dash&type=file&path=/')
                            if (q('action') === 'edit') {
                                return endbuild((await endget('/pages/dash/main.html'))
                                    .replace('{{CONTENT}}', await endget('/pages/dash/content/file_edit.html'))
                                    .replace('<!--CODEMIRROR_MODE-->', ((ext) => {
                                        switch (ext) {
                                            case 'js':
                                                return 'javascript'
                                            case 'css':
                                                return 'css'
                                            case 'html':
                                                return 'htmlmixed'
                                            case 'md':
                                                return 'markdown'
                                            case 'json':
                                                return 'javascript'
                                            case 'txt':
                                                return 'text/plain'
                                            case 'yml':
                                                return 'yaml'
                                            default:
                                                return 'text/plain'
                                        }
                                    })(q('path').split('.').pop()))
                                    .replace('<!--CODEMIRROR_IMPORT-->', ((ext) => {
                                        //import hint
                                        let importhtml = ''
                                        const codemirrorcdn = 'https://NPM_CDN/codemirror@5.60.0'
                                        importhtml += `<script src="${codemirrorcdn}/addon/hint/show-hint.js"></script>`
                                        importhtml += `<link rel="stylesheet" href="${codemirrorcdn}/addon/hint/show-hint.css">`

                                        switch (ext) {
                                            case 'js':
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/javascript-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/mode/javascript/javascript.js"></script>`
                                                break
                                            case 'css':
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/css-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/mode/css/css.js"></script>`
                                                break
                                            case 'html':
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/html-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/mode/htmlmixed/htmlmixed.js"></script>`
                                                break
                                            case 'md':
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/show-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/html-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/javascript-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/css-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/xml-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/show-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/anyword-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/mode/markdown/markdown.js"></script>`
                                                break
                                            case 'yml':
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/show-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/mode/yaml/yaml.js"></script>`
                                                break
                                            case 'json':
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/show-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/anyword-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/javascript-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/mode/javascript/javascript.js"></script>`
                                                break
                                            default:
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/show-hint.js"></script>`
                                                importhtml += `<script src="${codemirrorcdn}/addon/hint/anyword-hint.js"></script>`
                                                break
                                        }
                                        return importhtml
                                    })(q('path').split('.').pop()))
                                )
                            }
                            if (q('action') === 'preview') {
                                return endbuild((await endget('/pages/dash/main.html'))
                                    .replace('{{CONTENT}}', await endget('/pages/dash/content/file_preview.html'))
                                    .replace('<!--PREVIEW_HTML-->', (() => {
                                        const url = q('download_url')
                                        switch (q('ptype')) {
                                            case 'img':
                                                return `<img src="${url}" />`
                                            case 'video':
                                                return `<video src="${url}" controls></video>`
                                            case 'audio':
                                                return `<audio src="${url}" controls></audio>`
                                            case 'pdf':
                                                return `<embed src="${url}" type="application/pdf" width="100%" height="100%"></embed>`
                                            default:
                                                return `无法识别此文件,尝试直接打开?<a href="${url}">${url}</a>`
                                        }
                                    })())
                                )

                            }
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/file.html'))
                                .replace('<!--API_LIST_BODY-->', await (async () => {
                                    end.searchParams.set('type', 'file')
                                    end.searchParams.set('action', 'list')
                                    end.searchParams.set('path', q('path') ? q('path') : '/')
                                    res = (await (await fetch(end)).json())
                                    table = ""
                                    if (q('path') !== '/') {

                                        table += `<tr><td><svg t="1646837807111" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2382" width="25" height="25"><path d="M862.3390425492543 244.51140683346165c-14.202934734696294 0-23.671556596622217 9.468623156464194-23.671556596622217 23.671556596622217s9.468623156464194 23.671556596622217 23.671556596622217 23.671556596622217c26.038713033007408 0 47.34311448778271 21.304401454775306 47.34311448778271 47.34311448778271v82.85044938271605H111.95068782111605v-175.16952192189632c0-26.038713033007408 21.304401454775306-47.34311448778271 47.343113193244434-47.34311448778271h168.0680552018173c11.835778298311109 0 23.671556596622217 2.3671551418469137 35.50733489493333 9.468623156464194l132.5607190123457 75.74898266263703c9.468623156464194 7.10146672007901 23.671556596622217 9.468623156464194 35.50733489493333 9.468623156464194h210.67685811136792c14.202934734696294 0 23.671556596622217-9.468623156464194 23.671556596622217-23.67155789116049s-9.468623156464194-23.671556596622217-23.671556596622217-23.671556596622217h-210.67685811136792c-4.734311578232097 0-7.10146672007901 0-11.835778298311109-2.3671551418469137l-132.5607190123457-75.74898266263703c-16.57008987654321-9.468623156464194-37.87449133131852-16.57008987654321-59.17889149155555-16.57008987654321h-168.0680552018173c-52.07742477147655 0-94.68622768102715 42.60880290955061-94.68622768102715 94.68622768102715v563.3830558024691c0 52.07742477147655 42.60880290955061 94.68622768102715 94.68622768102715 94.68622768102715h703.0452415348939c52.07742477147655 0 94.68622768102715-42.60880290955061 94.68622897556541-94.68622768102715V339.197634514489c0-52.07742477147655-42.60880290955061-94.68622768102715-94.68622897556541-94.68622768102715z m47.34311448778271 563.3830558024691c0 26.038713033007408-21.304401454775306 47.34311448778271-47.34311448778271 47.343113193244434H159.2938010143605c-26.038713033007408 0-47.34311448778271-21.304401454775306-47.343113193244434-47.343113193244434V467.0240419486024h795.3643140740738v340.87042068732825z" fill="" p-id="2383"></path></svg>
                                       </td><td><a href="javascript:backtotop()">.</a></td><td></td><td></td></tr>`
                                        table += `<tr><td><svg t="1646837807111" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2382" width="25" height="25"><path d="M862.3390425492543 244.51140683346165c-14.202934734696294 0-23.671556596622217 9.468623156464194-23.671556596622217 23.671556596622217s9.468623156464194 23.671556596622217 23.671556596622217 23.671556596622217c26.038713033007408 0 47.34311448778271 21.304401454775306 47.34311448778271 47.34311448778271v82.85044938271605H111.95068782111605v-175.16952192189632c0-26.038713033007408 21.304401454775306-47.34311448778271 47.343113193244434-47.34311448778271h168.0680552018173c11.835778298311109 0 23.671556596622217 2.3671551418469137 35.50733489493333 9.468623156464194l132.5607190123457 75.74898266263703c9.468623156464194 7.10146672007901 23.671556596622217 9.468623156464194 35.50733489493333 9.468623156464194h210.67685811136792c14.202934734696294 0 23.671556596622217-9.468623156464194 23.671556596622217-23.67155789116049s-9.468623156464194-23.671556596622217-23.671556596622217-23.671556596622217h-210.67685811136792c-4.734311578232097 0-7.10146672007901 0-11.835778298311109-2.3671551418469137l-132.5607190123457-75.74898266263703c-16.57008987654321-9.468623156464194-37.87449133131852-16.57008987654321-59.17889149155555-16.57008987654321h-168.0680552018173c-52.07742477147655 0-94.68622768102715 42.60880290955061-94.68622768102715 94.68622768102715v563.3830558024691c0 52.07742477147655 42.60880290955061 94.68622768102715 94.68622768102715 94.68622768102715h703.0452415348939c52.07742477147655 0 94.68622768102715-42.60880290955061 94.68622897556541-94.68622768102715V339.197634514489c0-52.07742477147655-42.60880290955061-94.68622768102715-94.68622897556541-94.68622768102715z m47.34311448778271 563.3830558024691c0 26.038713033007408-21.304401454775306 47.34311448778271-47.34311448778271 47.343113193244434H159.2938010143605c-26.038713033007408 0-47.34311448778271-21.304401454775306-47.343113193244434-47.343113193244434V467.0240419486024h795.3643140740738v340.87042068732825z" fill="" p-id="2383"></path></svg>
                                       </td><td><a href="javascript:back()">..</a></td><td></td><td></td></tr>`


                                    }
                                    const intelligent_bytes = (bytes) => {
                                        if (bytes < 1024) return bytes + ' B';
                                        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
                                        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
                                        else return (bytes / 1073741824).toFixed(2) + ' GB';
                                    }
                                    //将res.data中以res.type排序
                                    res.data.sort((a, b) => {
                                        if (a.type === b.type) return 0;
                                        else if (a.type === 'dir') return -1;
                                        else return 1;
                                    })
                                    for (let j = 0; j < res.data.length; j++) {
                                        i = res.data[j]
                                        i.ext = i.name.split('.').pop()
                                        //判断是否为图片
                                        if (i.type === 'file') {
                                            if (i.ext === 'jpg' || i.ext === 'png' || i.ext === 'gif' || i.ext === 'jpeg') {
                                                i.type = "img"
                                            }
                                        }

                                        table += `<tr>
                                        <td style="width:25px">${i.type == "dir" ? `
                                        <svg t="1646837807111" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2382" width="25" height="25"><path d="M862.3390425492543 244.51140683346165c-14.202934734696294 0-23.671556596622217 9.468623156464194-23.671556596622217 23.671556596622217s9.468623156464194 23.671556596622217 23.671556596622217 23.671556596622217c26.038713033007408 0 47.34311448778271 21.304401454775306 47.34311448778271 47.34311448778271v82.85044938271605H111.95068782111605v-175.16952192189632c0-26.038713033007408 21.304401454775306-47.34311448778271 47.343113193244434-47.34311448778271h168.0680552018173c11.835778298311109 0 23.671556596622217 2.3671551418469137 35.50733489493333 9.468623156464194l132.5607190123457 75.74898266263703c9.468623156464194 7.10146672007901 23.671556596622217 9.468623156464194 35.50733489493333 9.468623156464194h210.67685811136792c14.202934734696294 0 23.671556596622217-9.468623156464194 23.671556596622217-23.67155789116049s-9.468623156464194-23.671556596622217-23.671556596622217-23.671556596622217h-210.67685811136792c-4.734311578232097 0-7.10146672007901 0-11.835778298311109-2.3671551418469137l-132.5607190123457-75.74898266263703c-16.57008987654321-9.468623156464194-37.87449133131852-16.57008987654321-59.17889149155555-16.57008987654321h-168.0680552018173c-52.07742477147655 0-94.68622768102715 42.60880290955061-94.68622768102715 94.68622768102715v563.3830558024691c0 52.07742477147655 42.60880290955061 94.68622768102715 94.68622768102715 94.68622768102715h703.0452415348939c52.07742477147655 0 94.68622768102715-42.60880290955061 94.68622897556541-94.68622768102715V339.197634514489c0-52.07742477147655-42.60880290955061-94.68622768102715-94.68622897556541-94.68622768102715z m47.34311448778271 563.3830558024691c0 26.038713033007408-21.304401454775306 47.34311448778271-47.34311448778271 47.343113193244434H159.2938010143605c-26.038713033007408 0-47.34311448778271-21.304401454775306-47.343113193244434-47.343113193244434V467.0240419486024h795.3643140740738v340.87042068732825z" fill="" p-id="2383"></path></svg>
                                        `: (i.type == "img" ? `
                                        <svg t="1646918356542" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2210" width="25" height="25"><path d="M938.666667 553.92V768c0 64.8-52.533333 117.333333-117.333334 117.333333H202.666667c-64.8 0-117.333333-52.533333-117.333334-117.333333V256c0-64.8 52.533333-117.333333 117.333334-117.333333h618.666666c64.8 0 117.333333 52.533333 117.333334 117.333333v297.92z m-64-74.624V256a53.333333 53.333333 0 0 0-53.333334-53.333333H202.666667a53.333333 53.333333 0 0 0-53.333334 53.333333v344.48A290.090667 290.090667 0 0 1 192 597.333333a286.88 286.88 0 0 1 183.296 65.845334C427.029333 528.384 556.906667 437.333333 704 437.333333c65.706667 0 126.997333 16.778667 170.666667 41.962667z m0 82.24c-5.333333-8.32-21.130667-21.653333-43.648-32.917333C796.768 511.488 753.045333 501.333333 704 501.333333c-121.770667 0-229.130667 76.266667-270.432 188.693334-2.730667 7.445333-7.402667 20.32-13.994667 38.581333-7.68 21.301333-34.453333 28.106667-51.370666 13.056-16.437333-14.634667-28.554667-25.066667-36.138667-31.146667A222.890667 222.890667 0 0 0 192 661.333333c-14.464 0-28.725333 1.365333-42.666667 4.053334V768a53.333333 53.333333 0 0 0 53.333334 53.333333h618.666666a53.333333 53.333333 0 0 0 53.333334-53.333333V561.525333zM320 480a96 96 0 1 1 0-192 96 96 0 0 1 0 192z m0-64a32 32 0 1 0 0-64 32 32 0 0 0 0 64z" p-id="2211"></path></svg>
                                        `
                                                :
                                                `
                                        <svg t="1646837844490" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2592" width="25" height="25"><path d="M546.133333 635.259259c-3.792593 0-5.688889 0-9.481481-1.896296L159.288889 420.977778c-5.688889-3.792593-9.481481-9.481481-9.481482-17.066667s3.792593-13.274074 9.481482-17.066667L536.651852 185.837037c5.688889-3.792593 13.274074-3.792593 17.066667 0l377.362962 202.903704c5.688889 3.792593 9.481481 9.481481 9.481482 17.066666s-3.792593 13.274074-9.481482 17.066667l-375.466666 208.592593c-1.896296 1.896296-5.688889 3.792593-9.481482 3.792592zM208.592593 405.807407l337.54074 187.733334 337.540741-187.733334-337.540741-182.044444L208.592593 405.807407z" fill="" p-id="2593"></path><path d="M546.133333 786.962963c-3.792593 0-5.688889 0-9.481481-1.896296L159.288889 574.577778c-9.481481-5.688889-11.377778-17.066667-7.585185-26.548148 5.688889-9.481481 17.066667-13.274074 26.548148-7.585186l367.881481 204.8 367.881482-204.8c9.481481-5.688889 20.859259-1.896296 26.548148 7.585186 5.688889 9.481481 1.896296 20.859259-7.585185 26.548148L555.614815 785.066667c-1.896296 1.896296-5.688889 1.896296-9.481482 1.896296z" fill="" p-id="2594"></path><path d="M546.133333 940.562963c-3.792593 0-5.688889 0-9.481481-1.896296L159.288889 728.177778c-9.481481-5.688889-11.377778-17.066667-7.585185-26.548148 5.688889-9.481481 17.066667-13.274074 26.548148-7.585186l367.881481 204.8 367.881482-204.8c9.481481-5.688889 20.859259-1.896296 26.548148 7.585186 5.688889 9.481481 1.896296 20.859259-7.585185 26.548148L555.614815 938.666667c-1.896296 1.896296-5.688889 1.896296-9.481482 1.896296z" fill="" p-id="2595"></path></svg>
                                        `)}</td>
                                        <td><a href="javascript:load('${i.name}','${i.type}','${i.download_url}')">${i.name}</a></td>
                                        <td>${i.type == "dir" ? "文件夹" : intelligent_bytes(i.size)}</td>
                                        ${((i) => {
                                                return i.type == "dir" ? `` : `
                                            <td>
                                            <a href="${i.download_url}">下载</a> |
                                            <a href="javascript:file_delete('${i.name}')">删除</a>
                                            </td>
                                            `

                                            })(i)}
                                        </tr>`
                                    }
                                    return table
                                })())
                            )


                        case 'log':
                            end.searchParams.set('type', 'wexa')
                            end.searchParams.set('action', 'log')
                            end.searchParams.set('nodata', '0')
                            end.searchParams.set('start', new Date().getTime() - 1000 * 60 * 60 * 24 * 30)
                            end.searchParams.set('end', new Date().getTime())
                            res = await (await fetch(end)).json()
                            if (!res.ok) { throw '获取日志失败,请检查是否登陆已过期!' }
                            res = res.data.sort((a, b) => a.time - b.time)
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/log.html'))
                                .replace('<!--API_LOGS_DATA-->', (() => {
                                    let table = ''
                                    for (let i of res) {
                                        console.log(res)
                                        table += `
                                        <tr>
                            <td>
                               ${i.type || "无"}
                            </td>
                            <td>
                                ${i.action || '无'}
                            </td>
                            <td class="align-middle text-center">
                            <span class="badge badge-sm bg-gradient-success">
                            ${new Date(i.time).toLocaleString()} 
                            </span>
                                
                            </td>
                            <td class="align-middle text-center text-sm">
                            <span class="text-secondary text-xs font-weight-bold">${i.data || '无'}</span>
                            </td>
                            
                        </tr>`
                                    }
                                    return table
                                })())
                            )




                        case 'hexo':
                            [res1, res2, res3, res4, res5] = await Promise.all([
                                new Promise((resolve, reject) => {
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'count')
                                    end.searchParams.set('gettype', 'post')
                                    fetch(end).then(res => res.json()).then(res => {
                                        resolve(res)
                                    })
                                }),
                                new Promise((resolve, reject) => {
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'count')
                                    end.searchParams.set('gettype', 'draft')
                                    fetch(end).then(res => res.json()).then(res => {
                                        resolve(res)
                                    })
                                }),
                                new Promise((resolve, reject) => {
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'getci')
                                    fetch(end).then(res => res.json()).then(res => {
                                        resolve(res)
                                    })
                                }),
                                new Promise((resolve, reject) => {
                                    end.searchParams.set('type', 'info')
                                    fetch(end).then(res => res.json()).then(res => {
                                        resolve(res)
                                    })
                                }),
                                new Promise((resolve, reject) => {
                                    end.searchParams.set('type', 'hexo')
                                    end.searchParams.set('action', 'config')
                                    fetch(end).then(res => res.json()).then(res => {
                                        resolve(res)
                                    })
                                }),
                            ])


                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/hexo.html'))
                                .replace('<!--API_POST_COUNT-->', res1.ok ? res1.data : 'ERROR')
                                .replace('<!--API_DRAFT_COUNT-->', res2.ok ? res2.data : 'ERROR')
                                .replace('<!--API_CI_STATUS-->', res3.ok ? ((data) => {
                                    switch (data.status) {
                                        case 'in_progress':
                                            return "构建中"
                                        case 'completed':
                                            switch (data.conclusion) {
                                                case 'active':
                                                    return "已完成"
                                                case 'error':
                                                    return "构建失败"
                                                case 'success':
                                                    return "构建成功"
                                                case 'cancelled':
                                                    return "已取消"
                                                default:
                                                    return "未知:" + data.conclusion
                                            }
                                        default:
                                            return "创建中"
                                    }

                                })(res3.data) : 'ERROR')
                                .replace('<!--API_CI_TIME-->', res3.ok ? ((data) => {
                                    //return data.updated_at
                                    return data.updated_at.replace(/T/g, ' ').replace(/Z/g, '') + " UTC +0"
                                })(res3.data) : 'ERROR')
                                .replace('<!--CI_ACTION-->', res3.ok ? ((data) => {
                                    const html = '<a class="text-body text-sm font-weight-bold mb-0 icon-move-right mt-auto" href="<!--CI_ACTION-->"><!--CI_ACTION_INFO--><i class="fas fa-arrow-right text-sm ms-1" aria-hidden="true"></i></a>'
                                    switch (data.status) {
                                        case 'in_progress':
                                            return html.replace('<!--CI_ACTION_INFO-->', `取消构建`)
                                                .replace('<!--CI_ACTION-->', `javascript:cancel_ci()`)
                                        case 'completed':
                                            return html.replace('<!--CI_ACTION_INFO-->', `重新构建`)
                                                .replace('<!--CI_ACTION-->', `javascript:rebuild_ci()`)
                                        default:
                                            //查看日志
                                            return html.replace('<!--CI_ACTION_INFO-->', `请等待构建服务器创建完成后再操作`)
                                                .replace('<!--CI_ACTION-->', `javascript:say.e('无法在创建CI实例时终止构建')`)


                                    }
                                })(res3.data) : 'ERROR')
                                .replace('<!--API_WEXAGON_VERSION-->', res4.version)
                                .replace('<!--GOTO_EDIT_HEXO_CONFIG-->', '/dash?page=dash&type=file&action=edit&path=' + encodeURIComponent(res5.data.config.hexo))
                                //THEME

                                .replace('<!--GOTO_EDIT_THEME_CONFIG-->', '/dash?page=dash&type=file&action=edit&path=' + encodeURIComponent(res5.data.config.theme))


                            )
                        case 'home':
                            end.searchParams.set('type', 'info')
                            const dely_1 = new Date().getTime()
                            res = (await (await fetch(end)).json())
                            const delay = new Date().getTime() - dely_1
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/home.html'))
                                .replace('<!--WEXAGONAL_FRONT_VERSION-->', info.version)
                                .replace('<!--WEXAGONAL_BACKEND_VERSION-->', res.version)
                                .replace('<!--WEXAGONAL_BACKEND_DELAY-->', `<span style="${delay > 1000 ? 'color:red' : 'color:green'
                                    }">${delay}ms</span>`)

                            )
                        case 'config':
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/config.html'))

                            )
                        case 'social':
                            let INFO_CONTENT = ''
                            switch (q('action')) {
                                case 'friends':
                                    INFO_CONTENT = await endget('/pages/dash/content/social/friends.html')
                                    let INFO_LIST_CONTENT = ''
                                    end.searchParams.set('type', 'social')
                                    res = await fetch(end, {
                                        method: "POST",
                                        body: JSON.stringify({
                                            type: "LIST_FRIENDS"
                                        })
                                    }).then(res => res.json())
                                    if (!res.ok) { throw '获取好友列表失败' }

                                    Object.keys(res.data).forEach(ep => {
                                        friend = res.data[ep]
                                        INFO_LIST_CONTENT += `<tr>
                                        <td>
                                            <div class="d-flex px-2 py-1">
                                                <div>
                                                    <img src="${friend.social.avatar}" class="avatar avatar-sm me-3"
                                                        alt="user1">
                                                </div>
                                                <div class="d-flex flex-column justify-content-center">
                                                    <h6 class="mb-0 text-sm">${friend.social.nickname}</h6>
                                                    <p class="text-xs text-secondary mb-0">${friend.social.blog}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-xs font-weight-bold mb-0">${friend.social.description}</p>
                                        </td>
                                        <td class="align-middle text-center text-sm">
                                            ${((s) => {
                                                switch (s) {
                                                    case 'PENDING':
                                                        return '<span class="badge badge-pill bg-warning">等待对方接受</span>'
                                                    case 'NEED_CONFIRM':
                                                        return '<span class="badge badge-pill bg-warning">等待你的确认</span>'
                                                    case 'ACCEPT':
                                                        return '<span class="badge badge-pill bg-success">好友</span>'
                                                    case 'REJECT':
                                                        return '<span class="badge badge-pill bg-danger">已拒绝</span>'
                                                    case 'BLOCK':
                                                        return '<span class="badge badge-pill bg-primary">已屏蔽</span>'
                                                    default:
                                                        return '<span class="badge badge-pill bg-secondary">未知</span>'
                                                }
                                            })(friend.status)}
                                        </td>
                                        <td class="align-middle text-center">
                                            <span class="text-secondary text-xs font-weight-bold">${new Date(friend.time.update).toLocaleString()
                                            }</span>
                                        </td>
                                        <td class="align-middle">
                                        ${((s) => {
                                                const button_template = `<button class="btn btn-primary" type="button" onclick="{{BUT_ACTION}}">{{BUT_INNER}}</button>`
                                                let inneraction = ''
                                                switch (s) {
                                                    case 'NEED_CONFIRM':
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `accept_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '接受')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `reject_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '拒绝')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `block_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '屏蔽')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `update_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '更新')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `delete_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '删除')
                                                        break
                                                    case 'PENDING':
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `delete_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '删除')
                                                        break
                                                    case 'ACCEPT':
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `update_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '更新')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `delete_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '删除')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `block_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '屏蔽')

                                                        break
                                                    case 'REJECT':
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `delete_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '删除')
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `block_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '屏蔽')
                                                        break

                                                    case 'BLOCK':
                                                        inneraction += button_template
                                                            .replace('{{BUT_ACTION}}', `unblock_friend('${ep}')`)
                                                            .replace('{{BUT_INNER}}', '解封')
                                                        break
                                                    default:
                                                        return '错误的状态!'
                                                }
                                                return inneraction
                                            })(friend.status)}
                                            
                                        </td>
                                    </tr>`
                                    })
                                    INFO_CONTENT = INFO_CONTENT.replace('{{API_FRIENDS_LIST}}', INFO_LIST_CONTENT)
                                    break;
                                default:
                                    return Response.redirect('/dash?page=dash&type=social&action=friends')
                            }

                            end.searchParams.set('type', 'info')
                            res = (await (await fetch(end)).json())
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/social.html'))
                                .replace('{{API_USER_AVATAR}}', res.social.avatar)
                                .replace('{{API_USER_NICKNAME}}', res.social.nickname)
                                .replace('{{API_USER_DESCRIPTION}}', res.social.description)
                                .replace('{{INFO_CONTENT}}', INFO_CONTENT)
                            )


                        case 'edit':
                            switch (q('action')) {
                                case 'list':
                                    switch (q('gettype')) {
                                        case 'post':
                                            end.searchParams.set('type', 'hexo')
                                            end.searchParams.set('action', 'list')
                                            end.searchParams.set('gettype', 'post')
                                            res = (await (await fetch(end)).json())
                                            return endbuild((await endget('/pages/dash/main.html'))
                                                .replace('{{CONTENT}}', await endget('/pages/dash/content/post_list.html'))
                                                .replace('<!--API_LIST_BODY-->', (() => {
                                                    //res.data为list包含所有文件名,建立table,两个列,第一个为list中所有数据
                                                    let table = ''
                                                    for (let i = 0; i < res.data.length; i++) {
                                                        table += `<tr><td><a href="/dash?page=dash&type=edit&action=edit&gettype=post&name=${res.data[i]}">${res.data[i]}</a></td><td><a href="javascript:to_draft('${res.data[i]}')">转为草稿</a></td></tr>`
                                                    }
                                                    return table
                                                })())
                                            )
                                        case 'draft':
                                            end.searchParams.set('type', 'hexo')
                                            end.searchParams.set('action', 'list')
                                            end.searchParams.set('gettype', 'draft')
                                            res = (await (await fetch(end)).json())

                                            return endbuild((await endget('/pages/dash/main.html'))
                                                .replace('{{CONTENT}}', await endget('/pages/dash/content/post_list.html'))
                                                .replace('<!--API_LIST_BODY-->', (() => {
                                                    let table = ''
                                                    for (let i = 0; i < res.data.length; i++) {
                                                        table += `<tr><td><a href="/dash?page=dash&type=edit&action=edit&gettype=draft&name=${res.data[i]}">${res.data[i]}</a></td><td><a href="javascript:to_post('${res.data[i]}')">转为文章</a></td></tr>`
                                                    }
                                                    return table
                                                })())
                                            )
                                        case 'new':
                                            return endbuild((await endget('/pages/dash/main.html'))
                                                .replace('{{CONTENT}}', await endget('/pages/dash/content/new.html'))
                                            )
                                        default:
                                            return Response.redirect('/dash?page=dash&type=edit&action=list&gettype=post')
                                    }

                                case 'edit':
                                    return endbuild((await endget('/pages/dash/main.html'))
                                        .replace('{{CONTENT}}', await endget('/pages/dash/content/markdown_edit.html'))

                                    )
                                default:
                                    return Response.redirect('/dash?page=dash&type=edit&action=list')
                            }
                        case 'config':
                            return endbuild((await endget('/pages/dash/main.html'))
                                .replace('{{CONTENT}}', await endget('/pages/dash/content/config.html')))

                        default:
                            return Response.redirect('/dash?page=dash&type=home')
                    }


                case 'login':
                    return endbuild(await endget('/pages/login/index.html'))
                case 'signin':
                    switch (q('type')) {
                        case 'login':
                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/login.html')))
                        case 'endpoint':
                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/endpoint.html')))
                        case 'check':


                            end = new URL((info.https ? "https://" : "http://") + q('endpoint') + '/api')
                            end.searchParams.set('type', 'info')
                            res = await (await fetch(end)).json()
                            if (!res || !res.ok) return Response.redirect('/dash?page=signin&type=endpoint&error=1')
                            await db.write('endpoint', q('endpoint'))
                            if (!res.db) return Response.redirect('/dash?page=db')
                            if (!res.install) return Response.redirect('/dash?page=install')
                            return Response.redirect('/dash?page=login')


                        default:
                            return Response.redirect('/dash?page=signin&type=endpoint')
                    }

                case 'install':
                    switch (q('type')) {
                        case 'index':
                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/index.html')))
                        case 'signup':
                            return endbuild(
                                (await endget('/pages/signin/main.html'))
                                    .replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/type/signup.html'))
                                    .replace('{{ENDPOINT_DOMAIN}}', `${end.hostname}:${end.port ? end.port : 443}`)
                            )
                        case 'config_img':
                            switch (q('step')) {
                                case 'new':
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/type/img/index.html')))
                                case 'set':
                                    switch (q('pf')) {
                                        case 'smms':
                                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/type/img/quick/smms.html')))
                                        case 'ladydaily':
                                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/type/img/quick/ladydaily.html')))
                                        case 'http':
                                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/type/img/detail/http.html')))
                                    }
                                case 'index':
                                    return Response.redirect('/dash?page=install&type=config_img&step=new')
                                default:
                                    return Response.redirect('/dash?page=install&type=config_img&step=index')
                            }

                        case 'bind_hexo':
                            end.searchParams.set('type', 'test')
                            end.searchParams.set('init', 'hexo')

                            switch (q('step')) {
                                case 'auth':
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/install/type/hexo/index.html')))
                                case 'auth_user':
                                    end.searchParams.set('action', 'auth_user')
                                    end.searchParams.set('token', q('token'))
                                    res = await (await fetch(end)).json()
                                    if (!res.ok) return Response.redirect('/dash?page=install&type=bind_hexo&step=auth&error=1')
                                    end.searchParams.set('action', 'list_repo')
                                    end.searchParams.set('username', res.loginname)
                                    end.searchParams.set('org', q('org'))
                                    res2 = await (await fetch(end)).json()
                                    list = res2.repos.map(repo => {
                                        return `<option value="${repo.full_name}">${repo.full_name}</option>`
                                    }).join('')
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', (await endget('/pages/signin/content/install/type/hexo/auth_user.html'))
                                        .replace('<!--GITHUB_LOGINNAME-->', res.loginname)
                                        .replace('<!--GITHUB_REPOLIST-->', list)
                                    ))
                                case 'branch':
                                    end.searchParams.set('action', 'list_branches')
                                    end.searchParams.set('repo', q('repo'))
                                    //token
                                    end.searchParams.set('token', q('token'))
                                    res = await (await fetch(end)).json()
                                    if (!res.ok) return Response.redirect('/dash?page=install&type=bind_hexo&step=branch&error=1')
                                    list = res.branches.map(branch => {
                                        return `<option value="${branch.name}">${branch.name}</option>`
                                    }).join('')
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', (await endget('/pages/signin/content/install/type/hexo/branch.html'))
                                        .replace('<!--GITHUB_BRANCHLIST-->', list)
                                        .replace('<!--GITHUB_REPONAME-->', q('repo'))))
                                case 'test_hexo':
                                    end.searchParams.set('action', 'test_hexo')
                                    end.searchParams.set('repo', q('repo'))
                                    end.searchParams.set('branch', q('branch'))
                                    end.searchParams.set('token', q('token'))
                                    res = await (await fetch(end)).json()
                                    let check_res = ""
                                    check_res += res.ok ? '<span class="text-success">仓库检查成功</span><br>' : '<span class="text-danger">仓库检查失败</span><br>'
                                    check_res += '<details><summary仓库详细信息</summary>'
                                    check_res += res.hexo ? '<span class="text-success">Hexo是安装了的,其版本为' + res.hexo_version + ',其配置文件路径为' + res.config.hexo + '</span><br>' : '<span class="text-danger">Hexo并没有安装在此仓库中!</span><br>'

                                    check_res += res.theme ? '<span class="text-success">主题是安装了的,其主题名为' + res.theme + ',其配置文件路径为' + res.config.theme + '</span><br>' : '<span class="text-danger">主题并没有安装在此仓库中!</span><br>'

                                    check_res += res.pack ? '<span class="text-success">package.json是存在的' + '</span><br>' : '<span class="text-danger">package.json并没有在此仓库中!</span><br>'

                                    check_res += res.source ? '<span class="text-success">source文件夹是存在的' + '</span><br>' : '<span class="text-danger">source文件夹并没有在此仓库中!</span><br>'
                                    check_res += res.indexhtml ? '<span class="text-warning">我们意外发现了index.html的存在,情检查此仓库/分支是否为集成部署的源代码仓库!' + '</span><br>' : ''

                                    check_res += res.repo.permissions.admin ? '<span class="text-success">管理员权限是开启的</span><br>' : '<span class="text-warning">管理员权限是关闭的,这可能会带来以外的错误,建议将此用户设置为管理员!</span><br>'

                                    check_res += res.repo.permissions.push ? '<span class="text-success">仓库写入权限是开启的</span><br>' : '<span class="text-danger">没有仓库写入权限!!此用户仅只读权限!!</span><br>'
                                    //res.repo.disabled
                                    check_res += res.repo.disabled ? '<span class="text-danger">仓库已经被禁用,请先启用此仓库!</span><br>' : '<span class="text-success">仓库没有被禁用</span><br>'
                                    //res.repo.archived
                                    check_res += res.repo.archived ? '<span class="text-danger">仓库已经被归档,请先启用此仓库!</span><br>' : '<span class="text-success">仓库没有被归档</span><br>'
                                    //res.indexhtml
                                    //private
                                    check_res += res.repo.private ? '<span class="text-success">仓库是私有的.这没有太大影响.</span><br>' : '<span class="text-success">仓库是公开的.这也没关系.</span><br>'


                                    check_res += '</details>'
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', (await endget('/pages/signin/content/install/type/hexo/test_hexo.html'))
                                        .replace('<!--GITHUB_CHECK_RESPONSE-->', check_res)
                                        //GITHUB_REPONAME GITHUB_BRANCH
                                        .replace('<!--GITHUB_REPONAME-->', q('repo'))
                                        .replace('<!--GITHUB_BRANCH-->', q('branch'))
                                        //<!--DISABLED-->
                                        .replace('<!--DISABLED-->', !res.ok ? 'disabled' : '')
                                        .replace("<!--API_HEXO_CONFIG_PATH-->", res.config.hexo)
                                        .replace("<!--API_HEXO_THEME_PATH-->", res.config.theme)
                                    ))
                                case 'bind_workflow':
                                    end.searchParams.set('action', 'list_workflow')
                                    end.searchParams.set('repo', q('repo'))
                                    end.searchParams.set('branch', q('branch'))
                                    end.searchParams.set('token', q('token'))
                                    res = await (await fetch(end)).json()

                                    list = res.data.workflows.map(wf => {
                                        return `<option value="${wf.name}">${wf.name + ' - ' + wf.path}</option>`
                                    }).join('')
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', (await endget('/pages/signin/content/install/type/hexo/bind_workflow.html'))
                                        .replace('<!--GITHUB_BRANCH-->', q('branch'))
                                        .replace('<!--GITHUB_WORKFLOW_LIST-->', list)))
                                case 'dispatch':
                                    end.searchParams.set('action', 'reset_workflow')
                                    end.searchParams.set('repo', q('repo'))
                                    end.searchParams.set('branch', q('branch'))
                                    end.searchParams.set('token', q('token'))
                                    end.searchParams.set('workflow', q('workflow'))
                                    end.searchParams.set('onlydispatch', q('onlydispatch'))
                                    res = await (await fetch(end)).json()
                                    if (!res.ok) {
                                        return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', 'ERROR'))

                                    }
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', (await endget('/pages/signin/content/install/type/hexo/end.html'))))

                                default:
                                    return Response.redirect('/dash?page=install&type=bind_hexo&step=auth')
                            }
                        case 'finish':
                            end.searchParams.set('type', 'upload')
                            end.searchParams.set('data', q('data'))
                            res = await (await fetch(end)).json()
                            if (!res.ok) {
                                Response.redirect('/dash?page=signin&install_error=1')
                            }
                            return Response.redirect('/dash?page=signin')
                        default:

                            return Response.redirect('/dash?page=install&type=index')
                    }
                case 'db':
                    switch (q('type')) {
                        case 'platform':
                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/db/plat.html')))
                        case 'type':
                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/db/type.html')))
                        case 'setdb':
                            switch (q('dbtype')) {
                                case 'mongodb':
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/db/content/mongodb.html')))
                                case 'http':
                                    return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/db/content/http.html')))
                            }
                        case 'buildconfig':
                            return endbuild((await endget('/pages/signin/main.html')).replace('<!--SIGNIN_CONTENT-->', await endget('/pages/signin/content/db/buildconfig.html')))

                        default:
                            return Response.redirect('/dash?page=db&type=platform')
                    }
                default:
                    return Response.redirect('/dash?page=signin')

            }

        }
        if (domain === "source_cdn") {
            return endstatic(path)
        }
        if (domain === "npm_cdn") {
            return endnpm(path)
        }
        if (domain === 'ka-f.fontawesome.com' || domain == "kit.fontawesome.com") {
            return end_fontawesome(path)
        }
        return fetch(req)
    }
    catch (e) {
        return handle_error(e)
    }

}
const lfetch = async (urls, init) => {
    let controller = new AbortController();
    const PauseProgress = async (res) => {
        return new Response(await (res).arrayBuffer(), { status: res.status, headers: res.headers });
    };
    if (!Promise.any) {
        Promise.any = function (promises) {
            return new Promise((resolve, reject) => {
                promises = Array.isArray(promises) ? promises : []
                let len = promises.length
                let errs = []
                if (len === 0) return reject(new AggregateError('All promises were rejected'))
                promises.forEach((promise) => {
                    promise.then(value => {
                        resolve(value)
                    }, err => {
                        len--
                        errs.push(err)
                        if (len === 0) {
                            reject(new AggregateError(errs))
                        }
                    })
                })
            })
        }
    }
    if (typeof (urls) === "string") return fetch(urls, init)
    return Promise.any(urls.map(urls => {
        init = init || {}
        init.signal = controller.signal
        return new Promise((resolve, reject) => {
            fetch(urls, init)
                .then(PauseProgress)
                .then(res => {
                    if (res.status == 200) {
                        controller.abort();
                        resolve(res)
                    } else {
                        reject(res)
                    }
                })
        })
    }))
}




//Function

const Base64toBlob = (base64_data) => {
    const byteString = atob(base64_data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: 'image/png' });
}

!function (n) { "use strict"; function d(n, t) { var r = (65535 & n) + (65535 & t); return (n >> 16) + (t >> 16) + (r >> 16) << 16 | 65535 & r } function f(n, t, r, e, o, u) { return d(function (n, t) { return n << t | n >>> 32 - t }(d(d(t, n), d(e, u)), o), r) } function l(n, t, r, e, o, u, c) { return f(t & r | ~t & e, n, t, o, u, c) } function g(n, t, r, e, o, u, c) { return f(t & e | r & ~e, n, t, o, u, c) } function v(n, t, r, e, o, u, c) { return f(t ^ r ^ e, n, t, o, u, c) } function m(n, t, r, e, o, u, c) { return f(r ^ (t | ~e), n, t, o, u, c) } function i(n, t) { var r, e, o, u, c; n[t >> 5] |= 128 << t % 32, n[14 + (t + 64 >>> 9 << 4)] = t; var f = 1732584193, i = -271733879, a = -1732584194, h = 271733878; for (r = 0; r < n.length; r += 16)i = m(i = m(i = m(i = m(i = v(i = v(i = v(i = v(i = g(i = g(i = g(i = g(i = l(i = l(i = l(i = l(o = i, a = l(u = a, h = l(c = h, f = l(e = f, i, a, h, n[r], 7, -680876936), i, a, n[r + 1], 12, -389564586), f, i, n[r + 2], 17, 606105819), h, f, n[r + 3], 22, -1044525330), a = l(a, h = l(h, f = l(f, i, a, h, n[r + 4], 7, -176418897), i, a, n[r + 5], 12, 1200080426), f, i, n[r + 6], 17, -1473231341), h, f, n[r + 7], 22, -45705983), a = l(a, h = l(h, f = l(f, i, a, h, n[r + 8], 7, 1770035416), i, a, n[r + 9], 12, -1958414417), f, i, n[r + 10], 17, -42063), h, f, n[r + 11], 22, -1990404162), a = l(a, h = l(h, f = l(f, i, a, h, n[r + 12], 7, 1804603682), i, a, n[r + 13], 12, -40341101), f, i, n[r + 14], 17, -1502002290), h, f, n[r + 15], 22, 1236535329), a = g(a, h = g(h, f = g(f, i, a, h, n[r + 1], 5, -165796510), i, a, n[r + 6], 9, -1069501632), f, i, n[r + 11], 14, 643717713), h, f, n[r], 20, -373897302), a = g(a, h = g(h, f = g(f, i, a, h, n[r + 5], 5, -701558691), i, a, n[r + 10], 9, 38016083), f, i, n[r + 15], 14, -660478335), h, f, n[r + 4], 20, -405537848), a = g(a, h = g(h, f = g(f, i, a, h, n[r + 9], 5, 568446438), i, a, n[r + 14], 9, -1019803690), f, i, n[r + 3], 14, -187363961), h, f, n[r + 8], 20, 1163531501), a = g(a, h = g(h, f = g(f, i, a, h, n[r + 13], 5, -1444681467), i, a, n[r + 2], 9, -51403784), f, i, n[r + 7], 14, 1735328473), h, f, n[r + 12], 20, -1926607734), a = v(a, h = v(h, f = v(f, i, a, h, n[r + 5], 4, -378558), i, a, n[r + 8], 11, -2022574463), f, i, n[r + 11], 16, 1839030562), h, f, n[r + 14], 23, -35309556), a = v(a, h = v(h, f = v(f, i, a, h, n[r + 1], 4, -1530992060), i, a, n[r + 4], 11, 1272893353), f, i, n[r + 7], 16, -155497632), h, f, n[r + 10], 23, -1094730640), a = v(a, h = v(h, f = v(f, i, a, h, n[r + 13], 4, 681279174), i, a, n[r], 11, -358537222), f, i, n[r + 3], 16, -722521979), h, f, n[r + 6], 23, 76029189), a = v(a, h = v(h, f = v(f, i, a, h, n[r + 9], 4, -640364487), i, a, n[r + 12], 11, -421815835), f, i, n[r + 15], 16, 530742520), h, f, n[r + 2], 23, -995338651), a = m(a, h = m(h, f = m(f, i, a, h, n[r], 6, -198630844), i, a, n[r + 7], 10, 1126891415), f, i, n[r + 14], 15, -1416354905), h, f, n[r + 5], 21, -57434055), a = m(a, h = m(h, f = m(f, i, a, h, n[r + 12], 6, 1700485571), i, a, n[r + 3], 10, -1894986606), f, i, n[r + 10], 15, -1051523), h, f, n[r + 1], 21, -2054922799), a = m(a, h = m(h, f = m(f, i, a, h, n[r + 8], 6, 1873313359), i, a, n[r + 15], 10, -30611744), f, i, n[r + 6], 15, -1560198380), h, f, n[r + 13], 21, 1309151649), a = m(a, h = m(h, f = m(f, i, a, h, n[r + 4], 6, -145523070), i, a, n[r + 11], 10, -1120210379), f, i, n[r + 2], 15, 718787259), h, f, n[r + 9], 21, -343485551), f = d(f, e), i = d(i, o), a = d(a, u), h = d(h, c); return [f, i, a, h] } function a(n) { var t, r = "", e = 32 * n.length; for (t = 0; t < e; t += 8)r += String.fromCharCode(n[t >> 5] >>> t % 32 & 255); return r } function h(n) { var t, r = []; for (r[(n.length >> 2) - 1] = void 0, t = 0; t < r.length; t += 1)r[t] = 0; var e = 8 * n.length; for (t = 0; t < e; t += 8)r[t >> 5] |= (255 & n.charCodeAt(t / 8)) << t % 32; return r } function e(n) { var t, r, e = "0123456789abcdef", o = ""; for (r = 0; r < n.length; r += 1)t = n.charCodeAt(r), o += e.charAt(t >>> 4 & 15) + e.charAt(15 & t); return o } function r(n) { return unescape(encodeURIComponent(n)) } function o(n) { return function (n) { return a(i(h(n), 8 * n.length)) }(r(n)) } function u(n, t) { return function (n, t) { var r, e, o = h(n), u = [], c = []; for (u[15] = c[15] = void 0, 16 < o.length && (o = i(o, 8 * n.length)), r = 0; r < 16; r += 1)u[r] = 909522486 ^ o[r], c[r] = 1549556828 ^ o[r]; return e = i(u.concat(h(t)), 512 + 8 * t.length), a(i(c.concat(e), 640)) }(r(n), r(t)) } function t(n, t, r) { return t ? r ? u(t, n) : function (n, t) { return e(u(n, t)) }(t, n) : r ? o(n) : function (n) { return e(o(n)) }(n) } "function" == typeof define && define.amd ? define(function () { return t }) : "object" == typeof module && module.exports ? module.exports = t : n.md5 = t }(this);
