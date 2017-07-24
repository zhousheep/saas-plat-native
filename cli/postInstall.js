var fs = require('fs');
var spath = require('path');
//var os = require('os');

// 安装还有几件事需要做
// 生成keystore配置命令
// 生成build命令，构建android、ios、web、windows、macos

function getAllfiles(dir, findOne) {
  // if (arguments.length < 2) throw new TypeError('Bad arguments number');

  if (typeof findOne !== 'function') {
    throw new TypeError('The argument "findOne" must be a function');
  }

  eachFileSync(spath.resolve(dir), findOne);
}

function eachFileSync(dir, findOne) {
  var stats = fs.statSync(dir);
  var files = fullPath(dir, fs.readdirSync(dir));
  files.forEach(function(item) {
    findOne(item, stats);
  });

  // // 遍历子目录
  // if (stats.isDirectory()) {
  //   var files = fullPath(dir, fs.readdirSync(dir));
  //   // console.log(dir);
  //   files.forEach(function (f) {
  //     // eachFileSync(f, findOne);
  //     findOne(dir, stats);
  //   });
  // }
}

function fullPath(dir, files) {
  return files.map(function(f) {
    return spath.join(dir, f);
  });
}

getPackageJson('./../..', function(f, s) {
  var isPackageJson = f.match(/package\.json/);
  if (isPackageJson != null) {
    console.log('find package.json file: ' + f);
    if (isFile(f) == false) {
      console.log('configure package.json error!!');
      return;
    }
    var rf = fs.readFileSync(f, 'utf-8');
    var json = JSON.parse(rf);
    var searchKey = rf.match(/\n.*\"scripts\"\: \{\n/);

    // 生成build命令，构建android、ios、web、windows、macos
    if (!(/build/.test(rf))) {
      if (searchKey != null) {
        rf = rf.replace(searchKey[0], searchKey[0] +
          '    \"build\"\: \"node node_modules\/saas-plat-native\/cli\/build\.js --entry index.js --output outputs --web --android --ios --windows --macos\"\,\n'
        );
        fs.writeFileSync(f, rf, 'utf-8');
      }
    }

    // 生成keystore配置命令
    if (!(/configKeystore/.test(rf))) {
      if (searchKey != null) {
        rf = rf.replace(searchKey[0], searchKey[0] +
          '    \"configKeystore\"\: \"node node_modules\/saas-plat-native\/cli\/configKeystore\.js --config keystore.json\"\,\n'
        );
        fs.writeFileSync(f, rf, 'utf-8');
      }

      var keystoreFile = spath.join(spath.dirname(f), 'keystore.json');
      if (!exists(keystoreFile)) {
        fs.writeFileSync(f, json.stringfiy({
          file: json.name + '.keystore',
          alias: json.name,
          storePassword: '',
          keyPassword: ''
        }, null, 2), 'utf-8');
      }
    }
  }
});

function getPackageJson(dir, findOne) {
  if (typeof findOne !== 'function') {
    throw new TypeError('The argument "findOne" must be a function');
  }

  eachFileSync(spath.resolve(dir), findOne);
}

function isFile(path) {
  return exists(path) && fs.statSync(path).isFile();
}

function exists(path) {
  return fs.existsSync(path) || path.existsSync(path);
}

function isDir(path) {
  return exists(path) && fs.statSync(path).isDirectory();
}
