#include "dmzStarfighterPluginTargets.h"
#include <dmzSystem.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimeConfigToVector.h>
#include <dmzRuntimePluginInfo.h>

using namespace dmz;

namespace {

static const Vector Right (1.0, 0.0, 0.0);
static const Vector Up (0.0, 1.0, 0.0);
static const Vector Forward (0.0, 0.0, -1.0);

static Vector
random_vector (const Float64 Offset) {

   const Float64 HalfValue = Offset * 0.5;

   return Vector (
      (random () * Offset) - HalfValue,
      (random () * Offset) - HalfValue,
      (random () * Offset) - HalfValue);
}

};

dmz::StarfighterPluginTargets::StarfighterPluginTargets (
      const PluginInfo &Info,
      Config &local) :
      Plugin (Info),
      TimeSlice (Info),
      EventObserverUtil (Info, local),
      _log (Info),
      _objMod (0),
      _defaultObjHandle (0),
      _defaultEventHandle (0),
      _targetEventHandle (0),
      _maxTargetCount (100.0),
      _startPos (0.0, 0.0, -1500.0) {

   _init (local);
}


dmz::StarfighterPluginTargets::~StarfighterPluginTargets () {

}


// Plugin Interface
void
dmz::StarfighterPluginTargets::update_plugin_state (
      const PluginStateEnum State,
      const UInt32 Level) {

   if (State == PluginStateInit) {

   }
   else if (State == PluginStateStart) {

   }
   else if (State == PluginStateStop) {

   }
   else if (State == PluginStateShutdown) {

   }
}


void
dmz::StarfighterPluginTargets::discover_plugin (
      const PluginDiscoverEnum Mode,
      const Plugin *PluginPtr) {

   if (Mode == PluginDiscoverAdd) {

      if (!_objMod) { _objMod = ObjectModule::cast (PluginPtr); }
   }
   else if (Mode == PluginDiscoverRemove) {

      if (_objMod && (_objMod == ObjectModule::cast (PluginPtr))) { _objMod = 0; }
   }
}


// TimeSlice Interface
void
dmz::StarfighterPluginTargets::update_time_slice (const Float64 TimeDelta) {

   if (_objMod) {

      if (_targetTable.get_count () < _maxTargetCount) {

         Int32 count (0);

         while ((count < 10) && (_targetTable.get_count () < _maxTargetCount)) {

            count++;

            const Handle Target = _objMod->create_object (_targetType, ObjectLocal);

            if (Target) {

               TargetStruct *ts = new TargetStruct (Target);

               if (ts && _targetTable.store (Target, ts)) {

                  _objMod->store_position (
                     Target,
                     _defaultObjHandle,
                     random_vector (500) + _startPos);

                  _objMod->store_orientation (
                     Target,
                     _defaultObjHandle,
                     _startDir);

                  _objMod->activate_object (Target);
               }
               else if (ts) {

                  _objMod->destroy_object (Target);
                  delete ts; ts = 0; 
               }
            }
         }
      }
   }
}


// Event Observer Interface
void
dmz::StarfighterPluginTargets::close_event (
      const Handle EventHandle,
      const EventType &Type,
      const EventLocalityEnum Locality) {

}

dmz::Float64
dmz::StarfighterPluginTargets::rotate (
      const Float64 DeltaTime,
      const Float64 Start,
      const Float64 Target) {

   Float64 result (0.0);

   return result;
}


void
dmz::StarfighterPluginTargets::new_ori (
      const Float64 DeltaTime,
      const Vector &Dir,
      TargetStruct &obj,
      Matrix &ori) {

}


void
dmz::StarfighterPluginTargets::_init (Config &local) {

   RuntimeContext *context = get_plugin_runtime_context ();

   _targetType = config_to_object_type ("target-type.name", local, "raider", context);

   _startPos = config_to_vector ("start-position", local, _startPos);

   _startDir.from_axis_and_angle_radians (
      Up,
      config_to_float64 ("start-heading.value", local, Pi64));
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL dmz::Plugin *
create_dmzStarfighterPluginTargets (
      const dmz::PluginInfo &Info,
      dmz::Config &local,
      dmz::Config &global) {

   return new dmz::StarfighterPluginTargets (Info, local);
}

};
