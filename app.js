module.exports = async function() {
  let instance = {};
  instance.version = "0.9.7";

  instance.meterLib = require("./lib/meter.js");
  instance.listener = {};
  instance.runner = -1;
  instance.shutdown = function() {
    try {
      instance.listener.close();
      clearInterval(instance.runner);
    } catch(e) {
      console.log("Failed to shutdown runner",e);
    }
  }
  instance.server = async function(config,logger) {
    const meterLib = instance.meterLib;
    const fs = require("fs");
    const express = require('express');
    const bodyParser = require('body-parser');
    const urlencodedParser = bodyParser.urlencoded({ extended: false });
    let port = 3000;

    if(typeof logger !== 'undefined') {
      config._logger = logger;
    }

    const storage = {
      memstorage:{},
      get:function(key) {
        return this.memstorage[key];
      },
      set:function(key,value) {
        this.memstorage[key] = value;
      }
    };

    const main = async function(config) {
      let app = express();
      let msg = {
        payload: {},
        topic: 'statistics'
      };

      app.get('/msg', async function (req, res) {
          delete msg.payload.latest;
          const result = await meterLib(msg,config,storage);
          res.send(result);
      });

      app.get('/config', async function (req, res) {
          // caution circular structure with logger attached!
          delete config._logger;
          res.send(config);
      });

      app.post('/config',urlencodedParser,async function(req,res) {
          config = req.body;
          fs.writeFileSync("./config.json",JSON.stringify(config));
          res.send();
      });
      if(typeof config.staticFiles == 'undefined') {
        config.staticFiles = './public';
      }
      app.use(express.static(config.staticFiles, {}));

      instance.runner = setInterval(function() {
        delete msg.payload.latest;
        meterLib(msg,config,storage);
        if(typeof logger !== 'undefined') logger.debug("Auto updated statistics");
      },900000);
      if(typeof logger !== 'undefined') logger.info("Serving Casa-Corrently on http://localhost:"+port +"/");
      instance.listener = app.listen(port);
    };

    if(typeof process.env.PORT !== 'undefined') {
      port = process.env.PORT;
    }

    if(typeof config.port !== 'undefined') {
      // TODO: add unit test if port is taken from config nor from environment
      port = config.port;
    }
    main(config);
  };
  return instance;
};
