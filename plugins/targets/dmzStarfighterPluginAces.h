#ifndef DMZ_STARFIGHTER_PLUGIN_ACES_DOT_H
#define DMZ_STARFIGHTER_PLUGIN_ACES_DOT_H

#include <dmzEventModule.h>
#include <dmzEventModuleCommon.h>
#include <dmzEventObserverUtil.h>
#include <dmzObjectModule.h>
#include <dmzObjectObserverUtil.h>
#include <dmzRuntimeDataConverterTypesBase.h>
#include <dmzRuntimeDefinitions.h>
#include <dmzRuntimeEventType.h>
#include <dmzRuntimeLog.h>
#include <dmzRuntimeMessaging.h>
#include <dmzRuntimeObjectType.h>
#include <dmzRuntimePlugin.h>
#include <dmzRuntimeTimeSlice.h>
#include <dmzTypesBase.h>
#include <dmzTypesMatrix.h>
#include <dmzTypesHandleContainer.h>
#include <dmzTypesHashTableHandleTemplate.h>
#include <dmzTypesVector.h>

namespace dmz {

   class StarfighterPluginAces :
         public Plugin,
         public TimeSlice,
         public ObjectObserverUtil,
         public EventObserverUtil {

      public:
         StarfighterPluginAces (const PluginInfo &Info, Config &local);
         ~StarfighterPluginAces ();

         // Plugin Interface
         virtual void update_plugin_state (
            const PluginStateEnum State,
            const UInt32 Level);

         virtual void discover_plugin (
            const PluginDiscoverEnum Mode,
            const Plugin *PluginPtr);

         // TimeSlice Interface
         virtual void update_time_slice (const Float64 TimeDelta);

         // Object Observer Interface
         virtual void create_object (
            const UUID &Identity,
            const Handle ObjectHandle,
            const ObjectType &Type,
            const ObjectLocalityEnum Locality);

         virtual void destroy_object (
            const UUID &Identity,
            const Handle ObjectHandle);

         // Event Observer Interface
         virtual void close_event (
            const Handle EventHandle,
            const EventType &Type,
            const EventLocalityEnum Locality);

      protected:
         struct AceStruct {

            const Handle Object;
            Vector start;
            Vector point;
            Vector dir;
            Float64 heading;
            Float64 pitch;
            Float64 distance;
            Handle target;
            Float64 flyoff;

            AceStruct (const Handle TheObject) :
                  Object (TheObject),
                  heading (Pi64),
                  pitch (0.0),
                  distance (0.0),
                  target (0),
                  flyoff (-1.0) {;}
         };

         Handle _find_target ();

         Float64 _rotate (
            const Float64 DeltaTime,
            const Float64 Start,
            const Float64 Target);

         void _new_ori (
            const Float64 DeltaTime,
            const Vector &Dir,
            AceStruct &obj,
            Matrix &ori);

         void _init (Config &local);

         Log _log;
         Definitions _defs;

         ObjectModule *_objMod;
         EventModuleCommon *_common;

         Handle _defaultObjAttr;
         Handle _defaultEventAttr;
         Handle _targetEventAttr;
         Handle _sourceEventAttr;
         Handle _killsEventAttr;

         Message _launchMsg;
         DataConverterHandle _convert;

         EventType _detonationType;

         Int32 _maxAceCount;
         Float64 _aceSpeed;
         ObjectType _aceType;
         Vector _startPos;
         Matrix _startDir;
         ObjectType _targetType;

         HashTableHandleTemplate<AceStruct> _aceTable;
         HandleContainer _targets;

      private:
         StarfighterPluginAces ();
         StarfighterPluginAces (const StarfighterPluginAces &);
         StarfighterPluginAces &operator= (const StarfighterPluginAces &);

   };
};

#endif // DMZ_STARFIGHTER_PLUGIN_ACES_DOT_H
