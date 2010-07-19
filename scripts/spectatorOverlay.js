var dmz =
       { object: require("dmz/components/object")
       , overlay: require("dmz/components/overlay")
       , portal: require("dmz/components/portal")
       , input: require("dmz/components/input")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , messaging: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , util: require("dmz/types/util")
       }
  , modeOverlay = dmz.overlay.lookup("mode")
  , objOverlay = dmz.overlay.lookup("object")
  , posOverlay = dmz.overlay.lookup("position")
  , oriOverlay = dmz.overlay.lookup("orientation")
  , radarState = true
  , radarActive = false
  , radarSwitch = dmz.overlay.lookup("radar-switch")
  , radarSlider = dmz.overlay.lookup("radar-slider")
  , radarRange = dmz.overlay.lookup("radar-range")
  , text =
       { mode: modeOverlay.text()
       , obj: objOverlay.text()
       , pos: posOverlay.text()
       , ori: oriOverlay.text()
       }
//  Constants
  , RadarSpeed = 2
  , TetherChannel = dmz.defs.createNamedHandle("tether-portal")
  , WatchChannel = dmz.defs.createNamedHandle("watch-portal")
  , FollowChannel = dmz.defs.createNamedHandle("follow-portal")
  , OrbitChannel = dmz.defs.createNamedHandle("orbit-portal")
  , HKey = dmz.input.key.toValue("h")
//  Functions 
  , channelState
  ;


self.shutdown = function () {

  // Reset the text overlays to their original values.
  modeOverlay.text(text.mode);
  objOverlay.text(text.obj);
  posOverlay.text(text.pos);
  oriOverlay.text(text.ori);
  radarSwitch.setSwitchStateAll(true);
  radarSlider.scale(1);
};


channelState = function (channel, state) {

   if (state) {

      if (channel === TetherChannel) {

         modeOverlay.text(text.mode + "Free Fly");
      }
      else if (channel === WatchChannel) {

         modeOverlay.text(text.mode + "Watch");
      }
      else if (channel === FollowChannel) {

         modeOverlay.text(text.mode + "Follow");
      }
      else if (channel === OrbitChannel) {

         modeOverlay.text(text.mode + "Orbit");
      }
   }
};


dmz.time.setRepeatingTimer (self,  function (time) {

   var  hpr
     , scale
     , view = dmz.portal.view()
     ;

   if (view) {

      posOverlay.text(text.pos +
         view.position.x.toFixed() + " " +
         view.position.y.toFixed() + " " +
         view.position.z.toFixed());


      hpr = view.orientation.toEuler();

      hpr[0] = dmz.util.radiansToDegrees(hpr[0]);
      hpr[1] = dmz.util.radiansToDegrees(hpr[1]);
      hpr[2] = dmz.util.radiansToDegrees(hpr[2]);

      oriOverlay.text(text.ori +
         hpr[0].toFixed() + " " +
         hpr[1].toFixed() + " " +
         hpr[2].toFixed());
   }

   if (radarActive) {

      scale = radarSlider.scale()[0];

      if (radarState) {

         if (scale < 1) { scale += (RadarSpeed * time) }
         if (scale > 1) {

            scale = 1;
            radarActive = false;
         }
      }
      else {

         if (scale > 0.001) { scale -= (RadarSpeed * time) }
         if (scale <= 0.001) {

            scale = 0.001;
            radarActive = false;
            radarSwitch.setSwitchStateAll(false);
         }
      }

      radarSlider.scale(scale);
   }
});


dmz.input.channel.observe(self, TetherChannel, channelState);
dmz.input.channel.observe(self, WatchChannel, channelState);
dmz.input.channel.observe(self, FollowChannel, channelState);
dmz.input.channel.observe(self, OrbitChannel, channelState);


dmz.input.key.observe(self, function (channel, event) {

   if ((event.key === HKey) && event.state) {

      radarState = !radarState;
      if (radarState) { radarSwitch.setSwitchStateAll(true); }
      radarActive = true;
   }
});


dmz.messaging.subscribe(self, "DMZ_Entity_Attach_Message",  function (data) {

   objOverlay.text(text.obj + dmz.data.unwrapHandle(data));
});


dmz.messaging.subscribe(self, "DMZ_Overlay_Radar_Range_Message",  function (data) {

   radarRange.text(data.number("DMZ_Overlay_Radar_Range", 0).toFixed());
});
