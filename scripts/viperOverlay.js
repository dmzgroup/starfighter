var dmz =
       { object: require("dmz/components/object")
       , input: require("dmz/components/input")
       , isect: require("dmz/components/isect")
       , portal: require("dmz/components/portal")
       , overlay: require("dmz/components/overlay")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
       , util: require("dmz/types/util")
       , messaging: require("dmz/runtime/messaging")
       }
  , Forward = dmz.vector.Forward
  , VehicleType = dmz.objectType.lookup("vehicle")
  , rangeHandle = dmz.defs.createNamedHandle("DMZ_Overlay_Radar_Range")
  , targetHandle = dmz.defs.createNamedHandle("Weapon_Target_Lock")
  , active = 0
  ;

self.sight = dmz.overlay.lookup("crosshairs target switch");
self.top = dmz.overlay.lookup("crosshairs switch");
self.range = dmz.overlay.lookup("dradis-range");
if (!self.range) { self.log.error("overlay node dradis-range not found!"); }

dmz.time.setRepeatingTimer (self, function (time) {

   var hil = dmz.object.hil()
     , state
     , view
     , dir
     , which = 0
     , target
     ;

   if (self.sight && hil && (active > 0)) {

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

               if (type && type.isOfType(VehicleType)) {

                  which = 1;
                  target = value.object;
               }
            }
         });

         self.sight.enableSingleSwitchState(which);

         dmz.isect.enable(hil);

         if (self.target !== target) {

            dmz.object.unlinkSubObjects(hil, targetHandle);
            if (target) { dmz.object.link(targetHandle, hil, target); }
            self.target = target;
         }
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

   if (self.range) { self.range.text(data.number(rangeHandle, 0).toFixed()); }
});
