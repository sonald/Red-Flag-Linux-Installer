var dir_mode, fs, log, makeRootDirectory, path, success, util, child_process;

log = console.log;
require('colors');
fs = require('fs');

path = require('path');

util = require('util');

dir_mode = '0755';
child_process = require('child_process');

exports.generate = function(program) {
  var appjs, cp, mkdir, projectname, pacakgejs, source, write, name;
  name = program.args[1];

  if (name === void 0) {
    return console.log("Please provide a name for your application: $> hippo new <MyAppName>");
  }

  projectname = path.basename(name);
  if (projectname === '') {
    return console.log("Please provide a name for your application: $> hippo new <MyAppName>");
  }

  child_process.spawn('mkdir',['-p',name,'-m',dir_mode]).on("exit", function(code, signal) {
    if ( code !== 0 ) {
        console.log("make top dir error");
    }
    program.stylus = true;
    source = path.join(__dirname, '/../../new_project');

    mkdir = function(dir) {
      return fs.mkdirSync(path.join(name, dir), dir_mode);
    };
    cp = function(src, dest) {
      var destination, read, write;
      destination = path.join(name, dest || src);
      read = fs.createReadStream(path.join(source, src));
      write = fs.createWriteStream(destination);
      return util.pump(read, write);
    };
    write = function(fileName, content) {
      return fs.writeFileSync(path.join(name, fileName), content, 'utf8');
    };

    mkdir('/client');
    mkdir('/client/assets');
    mkdir('/client/views');
    mkdir('/client/assets/css');
    mkdir('/client/assets/images');
    mkdir('/server');
    mkdir('/server/services');

    cp('/.gitignore');
    cp('/.nodemonignore');
    cp('/README.md');
    cp('/app.js');
    cp ('/server/services/demo.js');

    cp('/client/assets/app.js');
    cp('/client/views/app.jade');
    cp('/client/views/layout.jade');
    cp('/client/views/css/default.css');
    if(program.bootstrap){
        cp('/client/assets/bootstrap-responsive.css');
        cp('/client/assets/bootstrap.css');
        cp('/client/assets/bootstrap.js');
    };


    pacakgejs = "{\n  \"name\": \"" + projectname + "\",\n  \"description\": \"An awesome real time application\",\n  \"version\": \"0.0.1\",\n  \"author\": \"Me <me@mydomain.com>\",\n  \"private\": true,\n  \"engines\": { \"node\": \">= 0.6.0\" },\n  \"dependencies\": {\n";
    pacakgejs += "    \"hippo\": \"0.1.x\"";
    pacakgejs += "\n  }\n}";
    write('/package.json', pacakgejs);
    log(("Success! Created app '" + projectname + "' with:").yellow);

    success("Basic calculate demo");
    success("Javascript example code");
    success("Jade for views");
    if(program.bootstrap){
        success("Css with bootstrap");
    };

    log("Next, run the following commands:".yellow);
    log("   cd " + name);
    log("   sudo npm install");
    log("To start your app:".yellow);
    return log("   node app.js");
  });
};

success = function(name, alternative) {
  return log(" ✓".green, name, (alternative || '').grey);
};

makeRootDirectory = function(name) {
  try {
    fs.mkdirSync(name, dir_mode);
    return true;
  } catch (e) {
    if (e.code === 'EEXIST') {
      log("Sorry the '" + name + "' directory already exists. Please choose another name for your app.");
      return false;
    } else {
      throw e;
    }
  }
};
