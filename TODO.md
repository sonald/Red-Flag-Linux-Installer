- ###autosync static files
- ###automatically serving all static js & css files
generate app.html template including all static js & css tags
- ###split dev & product mode
- ###api arguments validation
- ###log to file(dev/prod modes)
- ###mount /debug url for debugging info
- ###packing assets in prod
- ###assets headers auto inserted into head
- ###auto assemble assets of client side js
- ###client auto connect to dnode, and exports 'remote' object
make `remote` as a global usable object.
- use async to rewrite services loading
- use locals.scripts to populate scripts tag
- error handling
  * warn about invalid or unauthorized url access
- auto reloading when service updated
- testing
- scaffolding
- front-end ui framework
  

maybe
- [tablesort](http://tristen.ca/tablesort/demo/)
- [moment.js](http://momentjs.com/)
- [jwerty](http://keithcirkel.co.uk/jwerty/)
- [knob](http://anthonyterrien.com/knob/)
- [ansi.js](https://github.com/TooTallNate/ansi.js)
- debug by node-inspector
  node --debug/ kill -SIGUSR1
