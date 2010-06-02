#include <dmzObjectAttributeMasks.h>
#include <dmzObjectConsts.h>
#include <dmzObjectModule.h>
#include <dmzRenderModuleCoreOSG.h>
#include <dmzRenderUtilOSG.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimeConfigToVector.h>
#include <dmzRuntimeDefinitions.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimePluginInfo.h>
#include "dmzStarfighterPluginLaunchTubeOSG.h"

#include <osg/CullFace>
#include <osg/Material>
#include <osg/Geode>
#include <osg/Geometry>
#include <osg/BlendFunc>
#include <osg/Depth>
#include <osg/PolygonOffset>
#include <osg/Matrix>
#include <osg/RenderInfo>
#include <osg/Texture2D>

#include <osgDB/ReadFile>

dmz::StarfighterPluginLaunchTubeOSG::StarfighterPluginLaunchTubeOSG (
      const PluginInfo &Info,
      Config &local) :
      Plugin (Info),
      TimeSlice (Info),
      ObjectObserverUtil (Info, local),
      _log (Info),
      _rc (Info),
      _defaultHandle (0),
      _apAttrHandle (0),
      _hilAttrHandle (0),
      _bsAttrHandle (0),
      _ltAttrHandle (0),
      _hil (0),
      _battlestar (0),
      _lt (0),
      _imgRc ("tube-wall"),
      _core (0) {

   _init (local);
}


dmz::StarfighterPluginLaunchTubeOSG::~StarfighterPluginLaunchTubeOSG () {

}


// Plugin Interface
void
dmz::StarfighterPluginLaunchTubeOSG::update_plugin_state (
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
dmz::StarfighterPluginLaunchTubeOSG::discover_plugin (
      const PluginDiscoverEnum Mode,
      const Plugin *PluginPtr) {

   if (Mode == PluginDiscoverAdd) {

      if (!_core) {

         _core = RenderModuleCoreOSG::cast (PluginPtr);

         if (_core) { _add_tube (); }
      }
   }
   else if (Mode == PluginDiscoverRemove) {

      if (_core &&  (_core == RenderModuleCoreOSG::cast (PluginPtr))) {

         _remove_tube ();
         _core = 0;
      }
   }
}


// TimeSlice Interface
void
dmz::StarfighterPluginLaunchTubeOSG::update_time_slice (const Float64 DeltaTime) {

   static const Vector Scale (1.0, 1.0, 1.0);
   static const Matrix Turn (Vector (0.0, 1.0, 0.0), -Pi64 * 0.5);

   ObjectModule *module = get_object_module ();

   if (module && _battlestar && _tube.valid ()) {

      Vector pos;

      if (module->lookup_position (_battlestar, _defaultHandle, pos)) {

         Matrix ori;
         module->lookup_orientation(_battlestar, _defaultHandle, ori);

         Vector value (_offset);

         osg::Matrix mat = to_osg_matrix (
            ori * Turn,
            pos + ori.transform_vector (value),
            Scale);

         _tube->setMatrix (mat);
      }
   }
}


// ObjectObserverUtil Interface
void
dmz::StarfighterPluginLaunchTubeOSG::link_objects (
      const Handle LinkHandle,
      const Handle AttributeHandle,
      const UUID &SuperIdentity,
      const Handle SuperHandle,
      const UUID &SubIdentity,
      const Handle SubHandle) {

   if (SubHandle == _hil) {

      _lt = SuperHandle;

      ObjectModule *module (get_object_module ());

      if (module) { module->lookup_vector (_lt, _ltAttrHandle, _offset); }
   }
}


void
dmz::StarfighterPluginLaunchTubeOSG::unlink_objects (
      const Handle LinkHandle,
      const Handle AttributeHandle,
      const UUID &SuperIdentity,
      const Handle SuperHandle,
      const UUID &SubIdentity,
      const Handle SubHandle) {

   if ((SuperHandle == _lt) && (SubHandle == _hil)) { _lt = 0; }
}


void
dmz::StarfighterPluginLaunchTubeOSG::update_object_flag (
      const UUID &Identity,
      const Handle ObjectHandle,
      const Handle AttributeHandle,
      const Boolean Value,
      const Boolean *PreviousValue) {

   if (AttributeHandle == _hilAttrHandle) {

      if (Value) { _hil = ObjectHandle; }
      else if (ObjectHandle == _hil) { _hil = 0; }
   }
   else if (AttributeHandle == _bsAttrHandle) {

      if (Value) { _battlestar = ObjectHandle; }
      else if (ObjectHandle == _battlestar) { _battlestar = 0; }
   }

   if (Value && _hil && _battlestar) {

      ObjectModule *module = get_object_module ();

      if (module) {

         Int64 count (0);

         module->lookup_counter (_hil, _apAttrHandle, count);

         update_object_counter (Identity, _hil, _apAttrHandle, count, 0);
      }
   }
}


void
dmz::StarfighterPluginLaunchTubeOSG::update_object_counter (
      const UUID &Identity,
      const Handle ObjectHandle,
      const Handle AttributeHandle,
      const Int64 Value,
      const Int64 *PreviousValue) {

   if ((ObjectHandle == _hil) && _toggle.valid ()) {


      if ((Value == 1) || (Value == 2)) {

         ObjectModule *module = get_object_module ();

         if (module && _battlestar) {

            module->store_flag (_battlestar, _hideAttrHandle, true);
         }

         _toggle->setAllChildrenOn ();
      }
      else {

         ObjectModule *module = get_object_module ();

         if (module && _battlestar) {

            module->store_flag (_battlestar, _hideAttrHandle, false);
         }

         _toggle->setAllChildrenOff ();
      }

   }
}


void
dmz::StarfighterPluginLaunchTubeOSG::_create_tube () {

   const String ImageName (_rc.find_file (_imgRc));

   osg::ref_ptr<osg::Image> img =
      (ImageName ? osgDB::readImageFile (ImageName.get_buffer ()) : 0);

   if (img.valid ()) {

      osg::Geode* geode = new osg::Geode ();

      osg::Geometry* geom = new osg::Geometry;

      osg::Vec4Array* colors = new osg::Vec4Array;
      colors->push_back (osg::Vec4 (1.0f, 1.0f, 1.0f, 1.0f));
      geom->setColorArray (colors);
      geom->setColorBinding (osg::Geometry::BIND_OVERALL);

      osg::StateSet *stateset = geom->getOrCreateStateSet ();
      stateset->setMode (GL_BLEND, osg::StateAttribute::ON);

#if 0
      osg::ref_ptr<osg::Material> material = new osg::Material;

      material->setEmission (
         osg::Material::FRONT_AND_BACK,
         osg::Vec4 (1.0, 1.0, 1.0, 1.0));

      stateset->setAttributeAndModes (material.get (), osg::StateAttribute::ON);
#endif

      osg::Texture2D *tex = new osg::Texture2D (img.get ());
      tex->setWrap (osg::Texture2D::WRAP_S, osg::Texture2D::REPEAT);
      tex->setWrap (osg::Texture2D::WRAP_T, osg::Texture2D::REPEAT);

      stateset->setTextureAttributeAndModes (0, tex, osg::StateAttribute::ON);

      stateset->setAttributeAndModes (new osg::CullFace (osg::CullFace::BACK));

      osg::Vec3Array *vertices = new osg::Vec3Array;
      osg::Vec2Array *tcoords = new osg::Vec2Array;
      osg::Vec3Array* normals = new osg::Vec3Array;

      const Float64 MinTopX (-1.5), MaxTopX (1.5);
      const Float64 MinBottomX (-3.0), MaxBottomX (3.0);
      const Float64 MinY (-5.0), MaxY (50.0);
      const Float64 MinZ (-1.5), MaxZ (2.0);

      osg::Vec3 v1 (MinBottomX, MaxY, MinZ);
      osg::Vec3 v2 (MaxBottomX, MaxY, MinZ);
      osg::Vec3 v3 (MaxBottomX, MinY, MinZ);
      osg::Vec3 v4 (MinBottomX, MinY, MinZ);
      osg::Vec3 v5 (MinTopX,    MaxY, MaxZ);
      osg::Vec3 v6 (MaxTopX,    MaxY, MaxZ);
      osg::Vec3 v7 (MaxTopX,    MinY, MaxZ);
      osg::Vec3 v8 (MinTopX,    MinY, MaxZ);

      osg::Vec3 n1 ( 0.0,  0.0,  1.0);
      osg::Vec3 n2 ( 0.0, -1.0,  0.0);
      osg::Vec3 n3 ( 0.0,  0.0, -1.0);
      osg::Vec3 n4 ( 0.0,  1.0,  0.0);
      osg::Vec3 n5 ((v2 - v3) ^ (v7 - v3));
//      osg::Vec3 n5 ((v7 - v3) ^ (v2 - v3));
      n5.normalize ();
      osg::Vec3 n6 ((v4 - v1) ^ (v5 - v1));
//      osg::Vec3 n6 ((v5 - v1) ^ (v4 - v1));
      n6.normalize ();

      const float FY (((float)MaxY - MinY) * 0.25f);
      const float FX (1.0f);
      const float F1 ((float)MaxY - MinY);
      const float F2 (1.0f);
      int count = 0;

      // 1 bottom
      vertices->push_back (v1);
      vertices->push_back (v4);
      vertices->push_back (v3);
      vertices->push_back (v2);
      tcoords->push_back (osg::Vec2 (FY, 0.0f));
      tcoords->push_back (osg::Vec2 (0.0f, 0.0f));
      tcoords->push_back (osg::Vec2 (0.0f, FX));
      tcoords->push_back (osg::Vec2 (FY, FX));
      normals->push_back (n1);
      count += 4;

/*
      // 2 front
      vertices->push_back (v1);
      vertices->push_back (v2);
      vertices->push_back (v6);
      vertices->push_back (v5);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n2);
      count += 4;
*/

      // 3 top
      vertices->push_back (v5);
      vertices->push_back (v6);
      vertices->push_back (v7);
      vertices->push_back (v8);
      tcoords->push_back (osg::Vec2 (FY, 0.0f));
      tcoords->push_back (osg::Vec2 (FY, FX));
      tcoords->push_back (osg::Vec2 (0.0f, FX));
      tcoords->push_back (osg::Vec2 (0.0f,0.0f));
      normals->push_back (n3);
      count += 4;

      // 4 back
      vertices->push_back (v3);
      vertices->push_back (v4);
      vertices->push_back (v8);
      vertices->push_back (v7);
      tcoords->push_back (osg::Vec2 (FY, 0.0f));
      tcoords->push_back (osg::Vec2 (FY, FX));
      tcoords->push_back (osg::Vec2 (0.0f, FX));
      tcoords->push_back (osg::Vec2 (0.0f,0.0f));
      normals->push_back (n4);
      count += 4;

      // 5 right side
      vertices->push_back (v2);
      vertices->push_back (v3);
      vertices->push_back (v7);
      vertices->push_back (v6);
      tcoords->push_back (osg::Vec2 (FY, FX));
      tcoords->push_back (osg::Vec2 (0.0f, FX));
      tcoords->push_back (osg::Vec2 (0.0f,0.0f));
      tcoords->push_back (osg::Vec2 (FY, 0.0f));
      normals->push_back (n5);
      count += 4;

      // 6 left side
      vertices->push_back (v1);
      vertices->push_back (v5);
      vertices->push_back (v8);
      vertices->push_back (v4);
      tcoords->push_back (osg::Vec2 (FY, FX));
      tcoords->push_back (osg::Vec2 (FY, 0.0f));
      tcoords->push_back (osg::Vec2 (0.0f,0.0f));
      tcoords->push_back (osg::Vec2 (0.0f, FX));
      normals->push_back (n6);
      count += 4;

      geom->setNormalArray (normals);
      geom->setNormalBinding (osg::Geometry::BIND_PER_PRIMITIVE);
      geom->addPrimitiveSet (new osg::DrawArrays (GL_QUADS, 0, count));
      geom->setVertexArray (vertices);
      geom->setTexCoordArray (0, tcoords);
      geode->addDrawable (geom);

      _tube = new osg::MatrixTransform ();

      _tube->addChild (geode);

      _toggle = new osg::Switch ();

      _toggle->addChild (_tube);
   }
   else { _log.error << "Failed to load: " << _imgRc << ":" << ImageName << endl; }
}


void
dmz::StarfighterPluginLaunchTubeOSG::_add_tube () {

   if (_toggle.valid () && _core) {

      UInt32 mask = _toggle->getNodeMask ();
      mask &= ~(_core->get_master_isect_mask ());
      _toggle->setNodeMask (mask);
      osg::Group *group = _core->get_dynamic_objects ();
      if (group) { group->addChild (_toggle.get ()); }
      else { _log.error << "Failed to add Space Box!" << endl; }
   }
}


void
dmz::StarfighterPluginLaunchTubeOSG::_remove_tube () {

   if (_toggle.valid () && _core) {

      UInt32 mask = _toggle->getNodeMask ();
      mask |= _core->get_master_isect_mask ();
      _toggle->setNodeMask (mask);
      osg::Group *group = _core->get_dynamic_objects ();
      if (group) { group->removeChild (_toggle.get ()); }
      else { _log.error << "Failed to remove Space Box!" << endl; }
   }
}


void
dmz::StarfighterPluginLaunchTubeOSG::_init (Config &local) {

   Definitions defs (get_plugin_runtime_context ());

   _defaultHandle = defs.create_named_handle (ObjectAttributeDefaultName);
   _hideAttrHandle = defs.create_named_handle (ObjectAttributeHideName);

   _imgRc = config_to_string ("image.resource", local, _imgRc);
   _offset = config_to_vector ("tube-offset", local, _offset);

   _hilAttrHandle = activate_object_attribute (
      ObjectAttributeHumanInTheLoopName,
      ObjectFlagMask);

   _bsAttrHandle = activate_object_attribute ("battlestar", ObjectFlagMask);

   _apAttrHandle = activate_object_attribute ("autopilot", ObjectCounterMask);

   _ltAttrHandle = activate_object_attribute (
      "Launch_Tube",
      ObjectLinkMask | ObjectUnlinkMask);

   _create_tube ();
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL dmz::Plugin *
create_dmzStarfighterPluginLaunchTubeOSG (
      const dmz::PluginInfo &Info,
      dmz::Config &local,
      dmz::Config &global) {

   return new dmz::StarfighterPluginLaunchTubeOSG (Info, local);
}

};
