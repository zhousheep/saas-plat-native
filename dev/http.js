var PORT = 8202;

var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var mine = require('./mine').types;
var path = require('path');
var config = require('./config').get();
var bundles = require('./bundles');

global.t = function (txt) {
  return txt;
}

function appversion(request, response) {
  var pathname = url.parse(request.url).pathname;
  console.log(pathname);
  var filename3 = path.join(config.BUNDLE_SRC, 'app', 'package.json');
  var json3 = {
    version: '1.0.0'
  };
  if (fs.existsSync(filename3)) {
    var packagefile2 = fs.readFileSync(filename3);
    json3 = JSON.parse(packagefile2);
  }
  response.write(JSON.stringify({
    data: {
      "name": json3.name,
      "version": 'HEAD', // 每次取最新版本
      "description": json3.description
    }
  }));
  response.end();
}

function readJsonFile(filename) {
  var json3 = {};
  if (fs.existsSync(filename)) {
    var packagefile = fs.readFileSync(filename);
    json3 = JSON.parse(packagefile);
  }
  return json3;
}

function downloadBundle(request, response) {
  var theurl = url.parse(request.url);
  console.log('download js file ' + theurl.query);
  var qs = querystring.parse(theurl.query);
  var js = bundles.get(qs.name, qs.platform || 'ios', qs.version || 'HEAD', qs.dev);
  response.writeHead(200, { 'Content-Type': 'text/javascript;charset=utf-8' });
  response.write(js);
  response.end();
}

function downloadMap(request, response) {
  var theurl = url.parse(request.url);
  console.log('download map file ' + theurl.query);
  var qs2 = querystring.parse(theurl.query);
  var json = bundles.map(qs2.name, qs2.platform, qs2.version, qs2.dev);
  response.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
  response.write(json);
  response.end();
}

function getAssets(request, response) {
  var theurl = url.parse(request.url);
  var qs3 = querystring.parse(theurl.query);
  var realPath1 = path.join(__dirname, '../', "src", qs3.name);
  console.log(realPath1);
  fs.exists(realPath1, function (exists) {
    if (!exists) {
      response.writeHead(404, { 'Content-Type': 'application/json;charset=utf-8' });
      response.write("This request URL " + pathname +
        " was not found on this server.");
      response.end();
    } else {
      fs.readFile(realPath1, function (err, file) {
        if (err) {
          response.writeHead(500);
          response.end(err);
        } else {
          response.writeHead(200, { 'Content-Type': mine.png });
          response.write(file);
          response.end();
        }
      });
    }
  });
}

function getJson(request, response) {
  var pathname = url.parse(request.url).pathname;
  var realPath = path.join(__dirname, "json", pathname + '/' + request.method +
    '.json');
  console.log(realPath);
  var ext = path.extname(realPath);
  ext = ext ?
    ext.slice(1) :
    'unknown';
  fs.exists(realPath, function (exists) {
    if (!exists) {
      response.writeHead(404, { 'Content-Type': 'application/json;charset=utf-8' });
      response.write("This request URL " + pathname +
        " was not found on this server.");
      response.end();
    } else {
      fs.readFile(realPath, function (err, file) {
        if (err) {
          response.writeHead(500);
          response.end(err);
        } else {
          var contentType = mine[ext] ||
            'application/json;charset=utf-8';
          response.writeHead(200, { 'Content-Type': contentType });
          if (ext == 'json') {
            var json;
            try {
              json = {
                errno: 0,
                data: JSON.parse(file)
              };
            } catch (errstr) {
              json = {
                errno: 1,
                errmsg: errstr
              };
            }
            response.write(JSON.stringify(json));
          } else {
            response.write(file);
          }
          response.end();
        }
      });
    }
  });
}

function getSplash(request, response) {
  var realPath1 = path.join(__dirname, 'img', 'splash.png');
  console.log(realPath1);
  fs.exists(realPath1, function (exists) {
    if (exists) {
      fs.readFile(realPath1, function (err, file) {
        if (!err) {
          response.writeHead(200, {
            'Content-Type': mine.png,
            'Last-Modified': new Date().toGMTString()
          });
          response.write(file);
          response.end();
        } else {
          response.end();
        }
      });
    } else {
      response.end();
    }
  });
}

function log(request, response) {
  var pathname = url.parse(request.url).pathname;
  console.log(pathname);
  // 数据块接收中
  var postData = '';
  request.addListener("data", function (postDataChunk) {
    postData += postDataChunk;
  });
  // 数据接收完毕，执行回调函数
  request.addListener("end", function () {
    try {
      //var data = lzwCompress.unpack(Buffer.from(postData, 'base64'));
      console.log(postData);
    } catch (err) {
      console.log(err);
    }
    response.end();
  });
}

function exeJs(request, response) {
  var pathname = url.parse(request.url).pathname;
  var realPath = path.join(__dirname, "json", pathname + '/' + request.method.toLocaleLowerCase() +
    '.js');
  console.log(realPath);
  fs.exists(realPath, function (exists) {
    if (!exists) {
      response.writeHead(404, { 'Content-Type': 'application/json;charset=utf-8' });
      response.write("This request URL " + pathname +
        " was not found on this server.");
      response.end();
    } else {
      var contentType = 'application/json;charset=utf-8';
      response.writeHead(200, { 'Content-Type': contentType });
      var data;
      try {
        //console.log(require.cache);
        delete require.cache[realPath];
        data = require(realPath).default()
      } catch (err) {
        console.log(err.stack);
        console.log(err);
      }
      response.write(JSON.stringify({
        errno: 0,
        data: data
      }, null, 2));
    }
    response.end();
  });
}

var server = http.createServer(function (request, response) {
  var pathname = url.parse(request.url).pathname;
  if (pathname == '/app/splash') {
    getSplash(request, response);
  } else if (pathname == '/bundle/file') {
    downloadBundle(request, response);
  } else if (pathname == '/bundle/map') {
    downloadMap(request, response);
  } else if (pathname == '/app/assets') {
    getAssets(request, response);
  } else if (pathname == '/app/version') {
    appversion(request, response);
  } else if (pathname == '/server/bundle/server1') {
    downloadBundle(request, response);
  } else if (pathname == '/app/log') {
    log(request, response);
  } else {
    //getJson(request, response);
    exeJs(request, response);
  }
});

server.listen(PORT);
console.log("Server runing at port: " + PORT + ".");
