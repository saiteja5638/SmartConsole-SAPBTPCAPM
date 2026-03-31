const cds = require("@sap/cds");
const fs = require('fs')
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser')
const readline = require("readline");
const express = require('express');
var globalIndex = 0;
const { INSERT, SELECT, UPSERT } = require("@sap/cds/lib/ql/cds-ql");
// GLOBAL ERROR HANDLERS
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
const importQueue = [];
const importQueue1 = [];
let processing = false;
cds.on("bootstrap", (app) => {
app.get('/GenerateSalesOrders',async(req,res)=>{
      try {
        ProcessSalesOrders()
        res.json({
          StatusCode:200,
          Status:"Triggered"
        })
      } catch (error) {
        console.log(error.message)
      }
  })
  app.get('/getTableNames', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      const result = await db.run(
        `SELECT TABLE_NAME FROM SYS.TABLES 
         WHERE SCHEMA_NAME = CURRENT_SCHEMA 
         AND IS_SYSTEM_TABLE = 'FALSE'`
      );
      const realTables = result
        .map(({ TABLE_NAME }) => TABLE_NAME)
        .filter(name => !name.includes("::") && !name.includes("TT"));

      let mapped = realTables.map(i => {
        let objmap = {
          tableName: i
        }
        return objmap
      })

      res.json(mapped)

    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  });
  app.get('/getMaskValue', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      let getFields = await cds.run(`SELECT * FROM  TT_MASKED_LOG_TABLE`)
      res.json(getFields)
    } catch (error) {
      console.log(error.message)
    }
  })
  app.get('/getFields', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      let getFields = await cds.run(`SELECT * FROM  TT_CONFIG_FIELDS`)
      res.json(getFields)
    } catch (error) {
      console.log(error.message)
    }
  })
  app.get('/getFieldsByTabName/:TabName', async (req, res) => {
    try {
      let fetchFields = await cds.run(`SELECT COLUMN_NAME,DATA_TYPE_NAME,IS_NULLABLE FROM SYS.TABLE_COLUMNS WHERE TABLE_NAME = '${req.params.TabName}' ORDER BY POSITION;`)
      res.json(fetchFields)
    } catch (error) {
      console.log(error.message)
    }
  })
  app.get('/onUpdateFields/:fields',async(req,res)=>{
    try {
       let getFields = req;
    } catch (error) {
      console.log(error.message)
    }
  })
  app.get('/getUpdateTables', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      const result = await db.run("SELECT * FROM TT_LOG_TABLE;")
      res.json(result)
    } catch (error) {
      console.log(error.message)
    }
  })
  app.get('/onClearLog', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      await db.run(`delete from TT_LOG_TABLE;`)
      res.json({
        Status: "Records Deleted",
        StatusCode: 200
      })
    } catch (error) {
      console.log(error.message)
    }
  })
  // app.get('/deleteall', async (req, res) => {
  //   try {
  //     const db = await cds.connect.to('db');
  //     const result = await db.run(
  //       `SELECT TABLE_NAME FROM SYS.TABLES 
  //        WHERE SCHEMA_NAME = CURRENT_SCHEMA 
  //        AND IS_SYSTEM_TABLE = 'FALSE'`
  //     );
  //     const realTables = result
  //       .map(({ TABLE_NAME }) => TABLE_NAME)
  //       .filter(name => !name.includes("::") && !name.includes("TT"));

  //     let mapped = realTables.map(i => {
  //       let objmap = {
  //         tableName: i
  //       }
  //       return objmap
  //     })

  //     for (let index = 0; index < mapped.length; index++) {
  //       const { tableName } = mapped[index];
  //       const db = await cds.connect.to('db');
  //       await db.run(`delete from ${tableName};`)

  //     }

  //     res.json("deleted")

  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).send(error.message);
  //   }
  // });
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'data-import-updated.html'));
  });
  app.get("/stream/:table/:offset", async (req, res) => {
    // try {
    //   const table = req.params.table;
    //   const db = await cds.connect.to("db");
    //   const BATCH = 1000;
    //   let offset = 0;
    //   res.setHeader("Content-Type", "application/x-ndjson");
    //   while (true) {
    //     const rows = await db.run(
    //       `SELECT * FROM "${table}" LIMIT ${BATCH} OFFSET ${offset}`
    //     );
    //     if (!rows || rows.length === 0) break;
    //     for (const row of rows) {
    //       res.write(JSON.stringify(row) + "\n");
    //     }
    //     offset += BATCH;
    //   }
    //   res.end();
    // } catch (error) {
    //   console.error("Stream error:", error.message);
    //   if (!res.headersSent) {
    //     res.status(500).json({ error: error.message });
    //   }
    // }

    try {
      const table = req.params.table;
      const db = await cds.connect.to("db");
      const BATCH = 5000;
      const MAX_ROWS = 2000000 + parseInt(req.params.offset);
      let offset = (parseInt(req.params.offset) == 0) ? 0 : parseInt(req.params.offset);
      while (offset < MAX_ROWS) {
        const remaining = MAX_ROWS - offset;
        const limit = Math.min(BATCH, remaining);
        const rows = await db.run(`SELECT * FROM "${table}" LIMIT ${limit} OFFSET ${offset}`);
        if (!rows || rows.length === 0) break;
        for (const row of rows) {
          res.write(JSON.stringify(row) + "\n");
        }
        offset += rows.length;
      }
      res.end();
    } catch (error) {
      console.error("Stream error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }


  });
  app.get('/importTable/:table/:system/:workers', async (req, res) => {
    try {
      const dominurl = [
        {
          system: 'test',
          url: "https://sbptest1-test-dataclassifer-srv.cfapps.us10-001.hana.ondemand.com"
        },
        {
          system: 'dev',
          url: "https://sbpbtp-vcpprovider-sc0jeojq-dev-dataclassifer-srv.cfapps.us10.hana.ondemand.com"
        }
      ];
      const system = dominurl.find(i => i.system === req.params.system);
      if (!system) {
        return res.status(404).json({
          Status: `${req.params.system} is not available`
        });
      }
      importQueue.push({
        table: req.params.table,
        url: system.url,
        offset: 0
      });
      processQueue(req.params.workers);

      await cds.run(INSERT.into("TT_LOG_TABLE").entries({
        LOG_ID: Math.floor(Math.random() * 123456789),
        TABLE_NAME: req.params.table,
        SYSTEM: req.params.system,
        LENGTH: 0,
        STATUS: "queue",
        MESSAGE: "Waiting in Queue"
      }))

      res.json({
        status: "queue",
        ok: "Success",
        Table: req.params.table,
        QueueLength: importQueue.length
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        Status: "Queue Failed",
        Error: error.message
      });

    }
  });
  app.use(bodyParser.json({ limit: '60mb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '60mb' }))
});
async function processLargeInsert(data, name, helpers) {
  try {
    const db = await cds.connect.to("db");
    const CHUNK_SIZE = (helpers * 3000);
    const WORKERS = helpers;
    const chunks = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      chunks.push(data.slice(i, i + CHUNK_SIZE));
    }
    let index = 0;
    async function worker() {
      while (index < chunks.length) {
        const current = index++;
        const chunk = chunks[current];
        try {
          await db.run(INSERT.into(name).entries(chunk));
        } catch (err) {
          console.error(`Insert failed for ${name}`, err.message);
          // await cds.run(`update TT_LOG_TABLE set MESSAGE = '${err.message}' where TABLE_NAME = '${name}'`);
        }

      }
    }
    const workers = [];
    for (let i = 0; i < WORKERS; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
  } catch (error) {
    console.error(`processLargeInsert Error for ${name}:`, error.message);
    await cds.run(`update TT_LOG_TABLE set MESSAGE = '${err.message}' where TABLE_NAME = '${name}'`);
  }
}
async function processQueue(workers) {
  if (processing) return;
  processing = true;
  try {
    while (importQueue.length > 0) {
      const job = importQueue.shift();
      try {
        console.log(`Starting import for ${job.table}`);
        await cds.run(`update TT_LOG_TABLE set MESSAGE = 'Starting import for ${job.table}' where TABLE_NAME = '${job.table}'`);
        const response = await axios({
          method: "get",
          url: `${job.url}/stream/${job.table}/${job.offset}`,
          responseType: "stream",
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          decompress: false,
          timeout: 0
        });
        const rl = readline.createInterface({
          input: response.data,
          crlfDelay: Infinity
        });
        const STREAM_BATCH = (workers * 1000);
        let buffer = [];
        let rows = 0;
        for await (const line of rl) {
          if (!line) continue;

          const record = JSON.parse(line);
          buffer.push(record);
          rows++;

          // 🔥 BACKPRESSURE CONTROL
          if (buffer.length >= STREAM_BATCH) {
            rl.pause(); // ⛔ STOP incoming stream

            await processLargeInsert(buffer, job.table, workers);

            buffer = [];
            rl.resume(); // ▶ RESUME stream
          }
        }
        if (buffer.length > 0) {
          await processLargeInsert(buffer, job.table, workers);
        }
        await cds.run(`update TT_LOG_TABLE set LENGTH = ${job.offset + rows} where TABLE_NAME = '${job.table}'`);
        if (rows >= 2000000) {
          const nextOffset = job.offset + rows;
          importQueue.push({
            table: job.table,
            url: job.url,
            offset: nextOffset
          });
          console.log(`Queued next batch for ${job.table} with offset ${nextOffset}`);
        }
        console.log(`Finished import for ${job.table} (${rows} rows)`);
        await cds.run(`update TT_LOG_TABLE set MESSAGE = 'Finished import for ${job.table}' where TABLE_NAME = '${job.table}'`);
        await cds.run(`update TT_LOG_TABLE set STATUS = 'processed' where TABLE_NAME = '${job.table}'`);
      } catch (error) {
        await cds.run(`update TT_LOG_TABLE set MESSAGE = '${error.message}' where TABLE_NAME = '${job.table}'`);
        await cds.run(`update TT_LOG_TABLE set STATUS = 'error' where TABLE_NAME = '${job.table}'`);
        console.error(`Import failed for ${job.table}`, error.message);
      }
    }
  }
  finally {
    processing = false;
    console.log(`Import All Completed`);
  }
}
async function processQueue1() {
  if (processing) return;
  processing = true;
  try {
    console.log("Process Started ✅")
    while (importQueue1.length > 0) {
      const payload = importQueue1.shift();
      try {
          await processLargeSalesOrderInsert(payload)
        console.log(`Imported Successfully PRODUCT ID : ${PRODUCT_ID} ${name}`)
      } catch (error) {
        console.error(`Import failed for ${name}`, error.message);
      }
    }
  } finally {
    processing = false;
    console.log(`Import All Completed`);
  }
}
async function ProcessSalesOrders() {
  try {
    const db = await cds.connect.to("db");
    let getProducts = await cds.run(`SELECT * FROM APP_DB_PRODUCT_STB`);

    const MAX_QUEUE = 10;
    const BATCH = 5000; 

    for (let index = 0; index < getProducts.length; index++) {
      const { PRODUCT_ID } = getProducts[index];


      let offset = 0;

      while (offset < 20000) {

        // 🛑 Pause if queue is full
        while (importQueue1.length >= MAX_QUEUE) {
          console.log("⏸️ Queue full... waiting");
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        const salesHeaders = await db.run(`
          SELECT * 
          FROM APP_DB_SALESH_STB  
          WHERE PRODUCT_ID = 'VCP_VEHICLE' 
          LIMIT ${BATCH} OFFSET ${offset}
        `);

        if (!salesHeaders.length) break;

        const docIds = salesHeaders.map(s => s.SALES_DOCUMENT);

        const salesConfig = await db.run(
          SELECT.from('APP_DB_SALESH_CONFIG_STB')
            .where({ SALES_DOCUMENT: { in: docIds } })
        );

        // Build map
        const configMap = new Map();
        for (const sc of salesConfig) {
          if (!configMap.has(sc.SALES_DOCUMENT)) {
            configMap.set(sc.SALES_DOCUMENT, []);
          }
          configMap.get(sc.SALES_DOCUMENT).push(sc);
        }

        let SO = [];
        let SOC = [];

        for (let i = 0; i < salesHeaders.length; i++) {
          const item = salesHeaders[i];

          let salesDocument = (8000000000 + globalIndex).toString();

          let filterCo = configMap.get(item.SALES_DOCUMENT) || [];

          let FilterSOC = filterCo.map(soc => ({
            ...soc,
            SALES_DOCUMENT: salesDocument,
            PRODUCT_ID: PRODUCT_ID
          }));

          const newItem = {
            ...item,
            SALES_DOCUMENT: salesDocument,
            PRODUCT_ID: PRODUCT_ID
          };

          SO.push(newItem);
          SOC.push(...FilterSOC);

          globalIndex++;
        }

        // ✅ move offset correctly
        offset += salesHeaders.length;

        importQueue1.push({
          PRODUCT_ID: PRODUCT_ID,
          workers: 2,
          SALESH: 'APP_DB_SALESH_STB',
          SALESCONFIG: 'APP_DB_SALESH_CONFIG_STB',
          SO: SO,
          SOC: SOC
        });

        console.log(`Queue Size: ${importQueue1.length}`);

        processQueue1(); // trigger processing
      }
    }

  } catch (error) {
    console.log(error.message);
  }
}
async function processLargeSalesOrderInsert(payload) {
  const {
    SO,
    SOC,
    SALESH,
    SALESCONFIG,
    workers = 2
  } = payload;

  const CHUNK_SIZE = 1000;
   const db = await cds.connect.to("db");

  try {
    // 🔹 Generic chunk processor
    async function processDataset(data, tableName) {
      let index = 0;

      async function worker() {
        while (index < data.length) {
          const start = index;
          index += CHUNK_SIZE;

          const chunk = data.slice(start, start + CHUNK_SIZE);

          try {
            await db.run(INSERT.into(tableName).entries(chunk));

            // ✅ small delay to reduce DB pressure
            await new Promise(r => setTimeout(r, 10));

          } catch (err) {
            console.error(`❌ Insert failed for ${tableName}:`, err.message);
          }
        }
      }

      // 🔹 run limited workers
      await Promise.all(
        Array.from({ length: workers }, () => worker())
      );
    }

    // 🔥 IMPORTANT: run SEQUENTIALLY (avoid memory spike)
    if (SO?.length) {
      await processDataset(SO, SALESH);
      console.log(`✅ SALESH inserted: ${SO.length}`);
    }

    if (SOC?.length) {
      await processDataset(SOC, SALESCONFIG);
      console.log(`✅ SALESCONFIG inserted: ${SOC.length}`);
    }

  } catch (error) {
    console.error(`❌ processLargeInsert Error:`, error.message);
  }
}
module.exports = cds.server;


