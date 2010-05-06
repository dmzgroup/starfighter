var dmz =
       { matrix: require("dmz/types/matrix")
       , vector: require("dmz/types/vector")
       , util: require("dmz/types/util")
       }
  , Forward = dmz.vector.Forward
  , Right = dmz.vector.Right
  , Up = dmz.vector.Up
  , print = require("sys").puts
  , clamp
  ;

clamp = function (Max, current, target) {

   var result = target
     , diff = target - current
     ;

   if (Math.abs(diff) > Math.PI) {

      diff = (((diff > 0) ? -1  : 1) * Math.PI * 2) + diff;
   }

   if (Math.abs(diff) > Max) {

      result = current + ((diff >= 0) ? Max : -Max);
   }

   return result;
};


exports.align = function (delta, rate, ori, target) {

   var chpr = ori.toEuler()
     , thpr = target.toEuler()
     , hmat = dmz.matrix.create()
     , pmat = dmz.matrix.create()
     , rmat = dmz.matrix.create()
     , Max = delta * rate
     ;

   thpr[0] = clamp (Max, chpr[0], thpr[0]);
   thpr[1] = clamp (Max, chpr[1], thpr[1]);
   thpr[2] = clamp (Max, chpr[2], thpr[2]);

   hmat.fromAxisAndAngle(Up, thpr[0]);
   pmat.fromAxisAndAngle(Right, thpr[1]);
   rmat.fromAxisAndAngle(Forward, thpr[2]);

   return hmat.multiply(pmat.multiply(rmat));
};
