'use strict';

function sshExec(conn, cmd) {
  let stdout = '';
  let stderr = '';
  return new Promise (function (resolve, reject) {
    conn.exec(cmd, function(err, stream) {
      /* istanbul ignore next */
      if (err) return reject(new Error(err));

      stream
        .on('close', function(code, signal) {
          /* istanbul ignore next */
          if (stderr) return reject(new Error(stderr.trim()));

          return resolve(stdout.trim());
        })
        .on('data', function(res) {
          stdout += res;
        })
        .stderr.on('data', function(data) {
          /* istanbul ignore next */
          stderr += data;
        });
    });
  })
}

function parseGPUInfo(arr, query) {
  const keys = Object.keys(query);
  let gpu = {};
  for (let i = 0; i < keys.length; i++) {
    let key = query[keys[i]];
    if (query[keys[i]] instanceof Object) {
      key = query[keys[i]].name;

      switch (query[keys[i]].type) {
        case 'int':
          gpu[key] = parseInt(arr[i]);
          break;
        case 'float':
          gpu[key] = parseFloat(arr[i]);
          break;
        case 'string':
          gpu[key] = arr[i].toString();
          break;
      }
    } else {
      gpu[key] = arr[i];
    }
  }
  return gpu;
}

module.exports = {
  sshExec, parseGPUInfo
};