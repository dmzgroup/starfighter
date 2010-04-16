var dmz =
       { object: require("dmz/components/object")
       , event: require("dmz/components/event")
       , common: require("dmz/components/eventCommon")
       , overlay: require("dmz/components/overlay")
       , input: require("dmz/components/input")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       }
,   autopilot = 0
,   light = dmz.overlay.lookup("autopilot-light")
,   start
//  Constants
,   Forward = dmz.vector.create(0, 0, -1)
,   Red = dmz.overlay.color("bar-red")
,   Yellow = dmz.overlay.color("bar-yellow")
,   Green = dmz.overlay.color("bar-green")
,   DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
,   MaxSpeed = 55.556 // meters per second -> 200 kilometers per hour
,   Acceleration = 60
//  Functions
,   timeSlice
;

if (!light) { self.log.error("Unable to find autopilot light"); }

timeSlice = function (Delta) {

   var hil = dmz.object.hil()
   ,   pos
   ,   ori
   ,   vel
   ,   dir
   ,   state
   ;

   if (hil && (autopilot == 1)) {

      pos = dmz.object.position (hil);
      ori = dmz.object.orientation (hil);
      vel = dmz.object.velocity (hil);
      state = dmz.object.state(hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      if (!start) { start = pos; }

      if (!state || !state.contains(DeadState)) {

         dir = ori.transform(Forward);
         vel = vel.add(dir.multiplyConst(Acceleration * Delta));
         pos = pos.add(vel.multiplyConst(Delta));
      }

      if (pos.subtract(start).magnitude() > 50) {

         dmz.time.cancleTimer(self, timeSlice);
         dmz.object.counter(hil, "autopilot", 0);
         start = undefined;
         if (light) { light.color(Red); }
      }

      dmz.object.position (hil, null, pos);
      dmz.object.orientation (hil, null, ori);
      dmz.object.velocity (hil, null, vel);
      dmz.object.state (hil, null, state);
   }
};

dmz.input.button.observe(self, function (Channel, Button) {

   if ((autopilot == 1) && (Button.id == 1) && (Button.value)) {

      if (dmz.util.isUndefined(start)) {

         dmz.time.setRepeatingTimer(self, timeSlice);
         dmz.common.createLaunch(dmz.object.hil());
      }
   }
   else if ((Button.id == 3) && (Button.value)) {

      dmz.object.position (dmz.object.hil(), null, dmz.vector.create());
      dmz.object.velocity (dmz.object.hil(), null, dmz.vector.create());
      dmz.object.orientation (dmz.object.hil(), null, dmz.matrix.create());
      dmz.object.counter (dmz.object.hil(), "autopilot", 1);
   }
});

dmz.object.counter.observe(self, "autopilot", function (handle, attr, value) {

   if (handle == dmz.object.hil ()) {

      autopilot = value;
	   if (light && (autopilot == 1)) { light.color(Green); }
   }
});
