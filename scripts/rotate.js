var dmz =
    { matrix: require("dmz/types/matrix")
    , vector: require("dmz/types/vector")
    , util: require("dmz/types/util")
    }
,   Up = dmz.vector.create(0, 1, 0)
,   Forward = dmz.vector.create(0, 0, -1)
,   Right = dmz.vector.create(1, 0, 0)
,   print = require("sys").puts
,   clamp
;

clamp = function (Max, current, target) {

   var result = target
   ,   diff = target - current
   ;

   if (Math.abs(diff) > Math.PI) {

      diff = (((diff > 0) ? -1  : 1) * Math.PI * 2) + diff;
   }

   if (Math.abs(diff) > Max) {

      result = current + ((diff >= 0) ? Max : -Max);
   }

   return result;
};


exports.getHPR = function (mat) {

   var result = [0, 0, 0]
   ,   cmat = mat
   ,   hvec = mat.transform(Forward)
   ,   hmat = dmz.matrix.create()
   ,   pvec
   ,   pmat = dmz.matrix.create()
   ,   rvec
   ,   rmat = dmz.matrix.create()
   ;

   hvec.y = 0;

   if (dmz.util.isNotZero(hvec.magnitude())) {

      hvec = hvec.normalize();
      result[0] = Forward.getSignedAngle(hvec);
      hmat = hmat.fromAxisAndAngle(Up, result[0]);
      hmat = hmat.transpose();
      cmat = hmat.multiply(cmat);
   }

   pvec = cmat.transform(Forward);
   if (dmz.util.isNotZero(pvec.y)) {

      result[1] = Forward.getSignedAngle(pvec);
      pmat = pmat.fromAxisAndAngle(Right, result[1]);
      pmat = pmat.transpose();
      cmat = pmat.multiply(cmat);
   }

   rvec = cmat.transform(Right);
   if (dmz.util.isNotZero(rvec.x)) {

      result[2] = Right.getSignedAngle(rvec);
   }

   return result;
};


exports.align = function (delta, rate, ori, target) {

   var chpr = exports.getHPR(ori)
   ,   thpr = exports.getHPR(target)
   ,   hmat = dmz.matrix.create()
   ,   pmat = dmz.matrix.create()
   ,   rmat = dmz.matrix.create()
   ,   Max = delta * rate
   ;

   thpr[0] = clamp (Max, chpr[0], thpr[0]);
   thpr[1] = clamp (Max, chpr[1], thpr[1]);
   thpr[2] = clamp (Max, chpr[2], thpr[2]);

   hmat.fromAxisAndAngle(Up, thpr[0]);
   pmat.fromAxisAndAngle(Right, thpr[1]);
   rmat.fromAxisAndAngle(Forward, thpr[2]);

   return hmat.multiply(pmat.multiply(rmat));
};
