var dmz =
       { object: require("dmz/components/object")
       , overlay: require("dmz/components/overlay")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       , consts: require("consts")
       }
  , APMode = dmz.consts.APMode
  , fadeSwitch = dmz.overlay.lookup("fade switch")
  , fadeTimeSlice
  , fade = false
  , alpha = 0
  ;


fadeTimeSlice = function (delta) {

   if (fade) {

      alpha += delta * 0.333;

      if (alpha > 1) {

         alpha = 1;
         dmz.time.cancleTimer(self, fadeTimeSlice);
      }
   }
   else {

      alpha -= delta * 0.5;

      if (alpha < 0) {

         alpha = 0;
         dmz.time.cancleTimer(self, fadeTimeSlice);
      }
   }

   fadeSwitch.color(0, 0, 0, alpha);
};


dmz.object.counter.observe(self, "autopilot", function (handle, attr, value) {

   if (handle === dmz.object.hil()) {

      dmz.time.cancleTimer(self, fadeTimeSlice);
      fadeSwitch.setSwitchStateAll(false);

      if (value === APMode.Landing) {

         fade = true;
         alpha = 0;
         fadeSwitch.color(0, 0, 0, alpha);
         fadeSwitch.setSwitchStateAll(true);
         dmz.time.setRepeatingTimer(self, fadeTimeSlice);
      }
      else if (value === APMode.Docked) {

         fade = false;
         alpha = 1;
         fadeSwitch.color(0, 0, 0, alpha);
         fadeSwitch.setSwitchStateAll(true);
         dmz.time.setRepeatingTimer(self, fadeTimeSlice);
      }
   }
});
