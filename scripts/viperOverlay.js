var dmz = {}
,   Forward
,   VehicleType
,   active = 0
,   rangeHandle
;

dmz.object= require("dmz/components/object");
dmz.input = require("dmz/components/input");
dmz.isect = require("dmz/components/isect");
dmz.portal = require("dmz/components/portal");
dmz.overlay = require("dmz/components/overlay");
dmz.time = require("dmz/runtime/time");
dmz.vector = require("dmz/types/vector");
dmz.matrix = require("dmz/types/matrix");
dmz.mask = require("dmz/types/mask");
dmz.defs = require("dmz/runtime/definitions");
dmz.objectType = require("dmz/runtime/objectType");
dmz.util = require("dmz/types/util");
dmz.messaging = require("dmz/runtime/messaging");

Forward = dmz.vector.create([0, 0, -1]);
VehicleType = dmz.objectType.lookup("vehicle")

self.target = dmz.overlay.lookup("crosshairs target switch");
self.top = dmz.overlay.lookup("crosshairs switch");
self.range = dmz.overlay.lookup("dradis-range");
rangeHandle = dmz.defs.createNamedHandle("DMZ_Overlay_Radar_Range");

dmz.time.setRepeatingTimer (self, function (time) {

   var hil = dmz.object.hil()
   ,   state
   ,   view
   ,   dir
   ,   which = 0
   ;

   if (self.target && hil && (active > 0)) {

      state = dmz.object.state(hil);

      view = dmz.portal.view();

      if (view) {

         dir = view.orientation.transform (Forward);

         dmz.isect.disable (hil);

         dmz.isect.doIsect({
            start: view.position,
            direction: dir,
            callback: function (value) {

               var type = dmz.object.type(value.object);

               if (type && type.isOfType(VehicleType)) { which = 1; }

               //self.log.error("got isect", value.object, type, which);
            }
         });

         self.target.enableSingleSwitchState(which);

         dmz.isect.enable(hil);
      }
   }
});


dmz.input.channel.observe (self, "first-person", function (channel, state) {

   if (state) { active++; }
   else { active--; }

   if (active == 1) {

      if (self.top) { self.top.enableSingleSwitchState(0); }
   }
   else if (active == 0) {

      if (self.top) { self.top.switchState(0, false); }
   }
});

dmz.messaging.subscribe ("DMZ_Overlay_Radar_Range_Message", self, function (data) {

   if (self.range) {

      self.range.text(Math.floor(data.number(rangeHandle, 0)).toString ());
   }
});
