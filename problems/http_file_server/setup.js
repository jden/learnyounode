const through    = require('through')
    , hyperquest = require('hyperquest')
    , bogan      = require('boganipsum')
    , fs         = require('fs')
    , path       = require('path')
    , os         = require('os')
    , bold       = require('workshopper/term-util').bold
    , red        = require('workshopper/term-util').red

function verify (trackFile, callback) {
  var track   = require(trackFile)
    , fscalls = track.calls.filter(function (call) {
        return call.module == 'fs'
          && call.stack[0].file != 'module.js'
          && call.stack[0].file != 'fs.js'
      })
    , badCalls = fscalls.filter(function (call) {
        return !(/createReadStream/).test(call.fn)
      })

  if (!badCalls.length)
    return callback() // yay!

  console.log('\nYou got the correct answer but used the following additional fs calls:')
  badCalls.forEach(function (call) {
    console.log('\t' + bold(red('fs.' + call.fn + '()')))
  })
  console.log('\nThis problem requires you to only use fs.createReadStream().\n')
  callback('bzzt!')
}

module.exports = function (run) {
  var file      = path.join(os.tmpDir(), 'learnyounode_' + process.pid + '.txt')
    , trackFile = path.join(os.tmpDir(), 'learnyounode_' + process.pid + '.json')
    , outputA   = through()
    , outputB   = through()

  setTimeout(function () {
    hyperquest.get('http://localhost:8000').pipe(outputA)
    if (!run)
      hyperquest.get('http://localhost:8001').pipe(outputB)
  }, 500)

  fs.writeFileSync(file, bogan({ paragraphs: 1, sentenceMax: 1 }), 'utf8')

  return {
      args        : [ file ]
    , a           : outputA
    , b           : outputB
    , modUseTrack : trackFile
    , verify      : verify.bind(null, trackFile)
    , long        : true
  }
}