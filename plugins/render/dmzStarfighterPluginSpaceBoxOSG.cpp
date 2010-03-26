#include <dmzRenderModuleCoreOSG.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimePluginInfo.h>
#include "dmzStarfighterPluginSpaceBoxOSG.h"

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

dmz::StarfighterPluginSpaceBoxOSG::StarfighterPluginSpaceBoxOSG (
      const PluginInfo &Info,
      Config &local) :
      Plugin (Info),
      _log (Info),
      _rc (Info),
      _offset (10000.0),
      _imgRc ("stars"),
      _core (0) {

   _init (local);
}


dmz::StarfighterPluginSpaceBoxOSG::~StarfighterPluginSpaceBoxOSG () {

}


// Plugin Interface
void
dmz::StarfighterPluginSpaceBoxOSG::update_plugin_state (
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
dmz::StarfighterPluginSpaceBoxOSG::discover_plugin (
      const PluginDiscoverEnum Mode,
      const Plugin *PluginPtr) {

   if (Mode == PluginDiscoverAdd) {

      if (!_core) {

         _core = RenderModuleCoreOSG::cast (PluginPtr);

         if (_core) { _create_box (); }
      }
   }
   else if (Mode == PluginDiscoverRemove) {

      if (_core &&  (_core == RenderModuleCoreOSG::cast (PluginPtr))) { _core = 0; }
   }
}


void
dmz::StarfighterPluginSpaceBoxOSG::_create_box () {

   const String ImageName (_rc.find_file (_imgRc));

   osg::ref_ptr<osg::Image> img =
      (ImageName ? osgDB::readImageFile (ImageName.get_buffer ()) : 0);

   if (img.valid () && _core) {

      osg::Geode* geode = new osg::Geode ();

      osg::Geometry* geom = new osg::Geometry;

      osg::Vec4Array* colors = new osg::Vec4Array;
      colors->push_back (osg::Vec4 (1.0f, 1.0f, 1.0f, 1.0f));
      geom->setColorArray (colors);
      geom->setColorBinding (osg::Geometry::BIND_OVERALL);

      osg::StateSet *stateset = geom->getOrCreateStateSet ();
      stateset->setMode (GL_BLEND, osg::StateAttribute::ON);

      osg::Texture2D *tex = new osg::Texture2D (img.get ());
      tex->setWrap (osg::Texture2D::WRAP_S, osg::Texture2D::REPEAT);
      tex->setWrap (osg::Texture2D::WRAP_T, osg::Texture2D::REPEAT);

      stateset->setTextureAttributeAndModes (0, tex, osg::StateAttribute::ON);

      stateset->setAttributeAndModes (new osg::CullFace (osg::CullFace::BACK));

      osg::Vec3Array *vertices = new osg::Vec3Array;
      osg::Vec2Array *tcoords = new osg::Vec2Array;
      osg::Vec3Array* normals = new osg::Vec3Array;

      const float Off (_offset);

      osg::Vec3 v1 (-Off, -Off, -Off);
      osg::Vec3 v2 ( Off, -Off, -Off);
      osg::Vec3 v3 ( Off,  Off, -Off);
      osg::Vec3 v4 (-Off,  Off, -Off);
      osg::Vec3 v5 (-Off, -Off,  Off);
      osg::Vec3 v6 ( Off, -Off,  Off);
      osg::Vec3 v7 ( Off,  Off,  Off);
      osg::Vec3 v8 (-Off,  Off,  Off);

      osg::Vec3 n1 ( 1.0,  1.0,  1.0);
      osg::Vec3 n2 (-1.0,  1.0,  1.0);
      osg::Vec3 n3 (-1.0, -1.0,  1.0);
      osg::Vec3 n4 ( 1.0, -1.0,  1.0);
      osg::Vec3 n5 ( 1.0,  1.0, -1.0);
      osg::Vec3 n6 (-1.0,  1.0, -1.0);
      osg::Vec3 n7 (-1.0, -1.0, -1.0);
      osg::Vec3 n8 ( 1.0, -1.0, -1.0);

      n1.normalize ();
      n2.normalize ();
      n3.normalize ();
      n4.normalize ();
      n5.normalize ();
      n6.normalize ();
      n7.normalize ();
      n8.normalize ();

      const float F1 (5.0f);
      const float F2 (2.5f);
      int count = 0;

      // 1
      vertices->push_back (v1);
      vertices->push_back (v2);
      vertices->push_back (v3);
      vertices->push_back (v4);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n1);
      normals->push_back (n2);
      normals->push_back (n3);
      normals->push_back (n4);
      count += 4;

      // 2
      vertices->push_back (v4);
      vertices->push_back (v3);
      vertices->push_back (v7);
      vertices->push_back (v8);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n4);
      normals->push_back (n3);
      normals->push_back (n7);
      normals->push_back (n8);
      count += 4;

      // 3
      vertices->push_back (v8);
      vertices->push_back (v7);
      vertices->push_back (v6);
      vertices->push_back (v5);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n8);
      normals->push_back (n7);
      normals->push_back (n6);
      normals->push_back (n5);
      count += 4;

      // 4
      vertices->push_back (v5);
      vertices->push_back (v6);
      vertices->push_back (v2);
      vertices->push_back (v1);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n5);
      normals->push_back (n6);
      normals->push_back (n2);
      normals->push_back (n1);
      count += 4;

      // 5
      vertices->push_back (v3);
      vertices->push_back (v2);
      vertices->push_back (v6);
      vertices->push_back (v7);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n3);
      normals->push_back (n2);
      normals->push_back (n6);
      normals->push_back (n7);
      count += 4;

      // 6
      vertices->push_back (v1);
      vertices->push_back (v4);
      vertices->push_back (v8);
      vertices->push_back (v5);
      tcoords->push_back (osg::Vec2 (F1, F1));
      tcoords->push_back (osg::Vec2 (F1, F2));
      tcoords->push_back (osg::Vec2 (F2, F2));
      tcoords->push_back (osg::Vec2 (F2, F1));
      normals->push_back (n1);
      normals->push_back (n4);
      normals->push_back (n8);
      normals->push_back (n5);
      count += 4;

      geom->setNormalArray (normals);
      geom->setNormalBinding (osg::Geometry::BIND_PER_VERTEX);
      geom->addPrimitiveSet (new osg::DrawArrays (GL_QUADS, 0, count));
      geom->setVertexArray (vertices);
      geom->setTexCoordArray (0, tcoords);
      geode->addDrawable (geom);

      osg::Group *group = _core->get_static_objects ();

      if (group) { group->addChild (geode); }
      else { _log.error << "Failed to add geode!" << endl; }
   }
   else { _log.error << "Failed to load: " << _imgRc << ":" << ImageName << endl; }
}


void
dmz::StarfighterPluginSpaceBoxOSG::_init (Config &local) {

   _imgRc = config_to_string ("image.resource", local, _imgRc);
   _offset = config_to_float64 ("box.offset", local, _offset);
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL dmz::Plugin *
create_dmzStarfighterPluginSpaceBoxOSG (
      const dmz::PluginInfo &Info,
      dmz::Config &local,
      dmz::Config &global) {

   return new dmz::StarfighterPluginSpaceBoxOSG (Info, local);
}

};
