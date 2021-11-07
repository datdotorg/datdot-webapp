(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/Leaflet.markercluster/dist/leaflet.markercluster-src.js":[function(require,module,exports){
/*
 * Leaflet.markercluster 1.5.3+master.e5124b2,
 * Provides Beautiful Animated Marker Clustering functionality for Leaflet, a JS library for interactive maps.
 * https://github.com/Leaflet/Leaflet.markercluster
 * (c) 2012-2017, Dave Leaver, smartrak
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory((global.Leaflet = global.Leaflet || {}, global.Leaflet.markercluster = {})));
}(this, function (exports) { 'use strict';

	/*
	 * L.MarkerClusterGroup extends L.FeatureGroup by clustering the markers contained within
	 */

	var MarkerClusterGroup = L.MarkerClusterGroup = L.FeatureGroup.extend({

		options: {
			maxClusterRadius: 80, //A cluster will cover at most this many pixels from its center
			iconCreateFunction: null,
			clusterPane: L.Marker.prototype.options.pane,

			spiderfyOnEveryZoom: false,
			spiderfyOnMaxZoom: true,
			showCoverageOnHover: true,
			zoomToBoundsOnClick: true,
			singleMarkerMode: false,

			disableClusteringAtZoom: null,

			// Setting this to false prevents the removal of any clusters outside of the viewpoint, which
			// is the default behaviour for performance reasons.
			removeOutsideVisibleBounds: true,

			// Set to false to disable all animations (zoom and spiderfy).
			// If false, option animateAddingMarkers below has no effect.
			// If L.DomUtil.TRANSITION is falsy, this option has no effect.
			animate: true,

			//Whether to animate adding markers after adding the MarkerClusterGroup to the map
			// If you are adding individual markers set to true, if adding bulk markers leave false for massive performance gains.
			animateAddingMarkers: false,

			// Make it possible to provide custom function to calculate spiderfy shape positions
			spiderfyShapePositions: null,

			//Increase to increase the distance away that spiderfied markers appear from the center
			spiderfyDistanceMultiplier: 1,

			// Make it possible to specify a polyline options on a spider leg
			spiderLegPolylineOptions: { weight: 1.5, color: '#222', opacity: 0.5 },

			// When bulk adding layers, adds markers in chunks. Means addLayers may not add all the layers in the call, others will be loaded during setTimeouts
			chunkedLoading: false,
			chunkInterval: 200, // process markers for a maximum of ~ n milliseconds (then trigger the chunkProgress callback)
			chunkDelay: 50, // at the end of each interval, give n milliseconds back to system/browser
			chunkProgress: null, // progress callback: function(processed, total, elapsed) (e.g. for a progress indicator)

			//Options to pass to the L.Polygon constructor
			polygonOptions: {}
		},

		initialize: function (options) {
			L.Util.setOptions(this, options);
			if (!this.options.iconCreateFunction) {
				this.options.iconCreateFunction = this._defaultIconCreateFunction;
			}

			this._featureGroup = L.featureGroup();
			this._featureGroup.addEventParent(this);

			this._nonPointGroup = L.featureGroup();
			this._nonPointGroup.addEventParent(this);

			this._inZoomAnimation = 0;
			this._needsClustering = [];
			this._needsRemoving = []; //Markers removed while we aren't on the map need to be kept track of
			//The bounds of the currently shown area (from _getExpandedVisibleBounds) Updated on zoom/move
			this._currentShownBounds = null;

			this._queue = [];

			this._childMarkerEventHandlers = {
				'dragstart': this._childMarkerDragStart,
				'move': this._childMarkerMoved,
				'dragend': this._childMarkerDragEnd,
			};

			// Hook the appropriate animation methods.
			var animate = L.DomUtil.TRANSITION && this.options.animate;
			L.extend(this, animate ? this._withAnimation : this._noAnimation);
			// Remember which MarkerCluster class to instantiate (animated or not).
			this._markerCluster = animate ? L.MarkerCluster : L.MarkerClusterNonAnimated;
		},

		addLayer: function (layer) {

			if (layer instanceof L.LayerGroup) {
				return this.addLayers([layer]);
			}

			//Don't cluster non point data
			if (!layer.getLatLng) {
				this._nonPointGroup.addLayer(layer);
				this.fire('layeradd', { layer: layer });
				return this;
			}

			if (!this._map) {
				this._needsClustering.push(layer);
				this.fire('layeradd', { layer: layer });
				return this;
			}

			if (this.hasLayer(layer)) {
				return this;
			}


			//If we have already clustered we'll need to add this one to a cluster

			if (this._unspiderfy) {
				this._unspiderfy();
			}

			this._addLayer(layer, this._maxZoom);
			this.fire('layeradd', { layer: layer });

			// Refresh bounds and weighted positions.
			this._topClusterLevel._recalculateBounds();

			this._refreshClustersIcons();

			//Work out what is visible
			var visibleLayer = layer,
			    currentZoom = this._zoom;
			if (layer.__parent) {
				while (visibleLayer.__parent._zoom >= currentZoom) {
					visibleLayer = visibleLayer.__parent;
				}
			}

			if (this._currentShownBounds.contains(visibleLayer.getLatLng())) {
				if (this.options.animateAddingMarkers) {
					this._animationAddLayer(layer, visibleLayer);
				} else {
					this._animationAddLayerNonAnimated(layer, visibleLayer);
				}
			}
			return this;
		},

		removeLayer: function (layer) {

			if (layer instanceof L.LayerGroup) {
				return this.removeLayers([layer]);
			}

			//Non point layers
			if (!layer.getLatLng) {
				this._nonPointGroup.removeLayer(layer);
				this.fire('layerremove', { layer: layer });
				return this;
			}

			if (!this._map) {
				if (!this._arraySplice(this._needsClustering, layer) && this.hasLayer(layer)) {
					this._needsRemoving.push({ layer: layer, latlng: layer._latlng });
				}
				this.fire('layerremove', { layer: layer });
				return this;
			}

			if (!layer.__parent) {
				return this;
			}

			if (this._unspiderfy) {
				this._unspiderfy();
				this._unspiderfyLayer(layer);
			}

			//Remove the marker from clusters
			this._removeLayer(layer, true);
			this.fire('layerremove', { layer: layer });

			// Refresh bounds and weighted positions.
			this._topClusterLevel._recalculateBounds();

			this._refreshClustersIcons();

			layer.off(this._childMarkerEventHandlers, this);

			if (this._featureGroup.hasLayer(layer)) {
				this._featureGroup.removeLayer(layer);
				if (layer.clusterShow) {
					layer.clusterShow();
				}
			}

			return this;
		},

		//Takes an array of markers and adds them in bulk
		addLayers: function (layersArray, skipLayerAddEvent) {
			if (!L.Util.isArray(layersArray)) {
				return this.addLayer(layersArray);
			}

			var fg = this._featureGroup,
			    npg = this._nonPointGroup,
			    chunked = this.options.chunkedLoading,
			    chunkInterval = this.options.chunkInterval,
			    chunkProgress = this.options.chunkProgress,
			    l = layersArray.length,
			    offset = 0,
			    originalArray = true,
			    m;

			if (this._map) {
				var started = (new Date()).getTime();
				var process = L.bind(function () {
					var start = (new Date()).getTime();

					// Make sure to unspiderfy before starting to add some layers
					if (this._map && this._unspiderfy) {
						this._unspiderfy();
					}

					for (; offset < l; offset++) {
						if (chunked && offset % 200 === 0) {
							// every couple hundred markers, instrument the time elapsed since processing started:
							var elapsed = (new Date()).getTime() - start;
							if (elapsed > chunkInterval) {
								break; // been working too hard, time to take a break :-)
							}
						}

						m = layersArray[offset];

						// Group of layers, append children to layersArray and skip.
						// Side effects:
						// - Total increases, so chunkProgress ratio jumps backward.
						// - Groups are not included in this group, only their non-group child layers (hasLayer).
						// Changing array length while looping does not affect performance in current browsers:
						// http://jsperf.com/for-loop-changing-length/6
						if (m instanceof L.LayerGroup) {
							if (originalArray) {
								layersArray = layersArray.slice();
								originalArray = false;
							}
							this._extractNonGroupLayers(m, layersArray);
							l = layersArray.length;
							continue;
						}

						//Not point data, can't be clustered
						if (!m.getLatLng) {
							npg.addLayer(m);
							if (!skipLayerAddEvent) {
								this.fire('layeradd', { layer: m });
							}
							continue;
						}

						if (this.hasLayer(m)) {
							continue;
						}

						this._addLayer(m, this._maxZoom);
						if (!skipLayerAddEvent) {
							this.fire('layeradd', { layer: m });
						}

						//If we just made a cluster of size 2 then we need to remove the other marker from the map (if it is) or we never will
						if (m.__parent) {
							if (m.__parent.getChildCount() === 2) {
								var markers = m.__parent.getAllChildMarkers(),
								    otherMarker = markers[0] === m ? markers[1] : markers[0];
								fg.removeLayer(otherMarker);
							}
						}
					}

					if (chunkProgress) {
						// report progress and time elapsed:
						chunkProgress(offset, l, (new Date()).getTime() - started);
					}

					// Completed processing all markers.
					if (offset === l) {

						// Refresh bounds and weighted positions.
						this._topClusterLevel._recalculateBounds();

						this._refreshClustersIcons();

						this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
					} else {
						setTimeout(process, this.options.chunkDelay);
					}
				}, this);

				process();
			} else {
				var needsClustering = this._needsClustering;

				for (; offset < l; offset++) {
					m = layersArray[offset];

					// Group of layers, append children to layersArray and skip.
					if (m instanceof L.LayerGroup) {
						if (originalArray) {
							layersArray = layersArray.slice();
							originalArray = false;
						}
						this._extractNonGroupLayers(m, layersArray);
						l = layersArray.length;
						continue;
					}

					//Not point data, can't be clustered
					if (!m.getLatLng) {
						npg.addLayer(m);
						continue;
					}

					if (this.hasLayer(m)) {
						continue;
					}

					needsClustering.push(m);
				}
			}
			return this;
		},

		//Takes an array of markers and removes them in bulk
		removeLayers: function (layersArray) {
			var i, m,
			    l = layersArray.length,
			    fg = this._featureGroup,
			    npg = this._nonPointGroup,
			    originalArray = true;

			if (!this._map) {
				for (i = 0; i < l; i++) {
					m = layersArray[i];

					// Group of layers, append children to layersArray and skip.
					if (m instanceof L.LayerGroup) {
						if (originalArray) {
							layersArray = layersArray.slice();
							originalArray = false;
						}
						this._extractNonGroupLayers(m, layersArray);
						l = layersArray.length;
						continue;
					}

					this._arraySplice(this._needsClustering, m);
					npg.removeLayer(m);
					if (this.hasLayer(m)) {
						this._needsRemoving.push({ layer: m, latlng: m._latlng });
					}
					this.fire('layerremove', { layer: m });
				}
				return this;
			}

			if (this._unspiderfy) {
				this._unspiderfy();

				// Work on a copy of the array, so that next loop is not affected.
				var layersArray2 = layersArray.slice(),
				    l2 = l;
				for (i = 0; i < l2; i++) {
					m = layersArray2[i];

					// Group of layers, append children to layersArray and skip.
					if (m instanceof L.LayerGroup) {
						this._extractNonGroupLayers(m, layersArray2);
						l2 = layersArray2.length;
						continue;
					}

					this._unspiderfyLayer(m);
				}
			}

			for (i = 0; i < l; i++) {
				m = layersArray[i];

				// Group of layers, append children to layersArray and skip.
				if (m instanceof L.LayerGroup) {
					if (originalArray) {
						layersArray = layersArray.slice();
						originalArray = false;
					}
					this._extractNonGroupLayers(m, layersArray);
					l = layersArray.length;
					continue;
				}

				if (!m.__parent) {
					npg.removeLayer(m);
					this.fire('layerremove', { layer: m });
					continue;
				}

				this._removeLayer(m, true, true);
				this.fire('layerremove', { layer: m });

				if (fg.hasLayer(m)) {
					fg.removeLayer(m);
					if (m.clusterShow) {
						m.clusterShow();
					}
				}
			}

			// Refresh bounds and weighted positions.
			this._topClusterLevel._recalculateBounds();

			this._refreshClustersIcons();

			//Fix up the clusters and markers on the map
			this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);

			return this;
		},

		//Removes all layers from the MarkerClusterGroup
		clearLayers: function () {
			//Need our own special implementation as the LayerGroup one doesn't work for us

			//If we aren't on the map (yet), blow away the markers we know of
			if (!this._map) {
				this._needsClustering = [];
				this._needsRemoving = [];
				delete this._gridClusters;
				delete this._gridUnclustered;
			}

			if (this._noanimationUnspiderfy) {
				this._noanimationUnspiderfy();
			}

			//Remove all the visible layers
			this._featureGroup.clearLayers();
			this._nonPointGroup.clearLayers();

			this.eachLayer(function (marker) {
				marker.off(this._childMarkerEventHandlers, this);
				delete marker.__parent;
			}, this);

			if (this._map) {
				//Reset _topClusterLevel and the DistanceGrids
				this._generateInitialClusters();
			}

			return this;
		},

		//Override FeatureGroup.getBounds as it doesn't work
		getBounds: function () {
			var bounds = new L.LatLngBounds();

			if (this._topClusterLevel) {
				bounds.extend(this._topClusterLevel._bounds);
			}

			for (var i = this._needsClustering.length - 1; i >= 0; i--) {
				bounds.extend(this._needsClustering[i].getLatLng());
			}

			bounds.extend(this._nonPointGroup.getBounds());

			return bounds;
		},

		//Overrides LayerGroup.eachLayer
		eachLayer: function (method, context) {
			var markers = this._needsClustering.slice(),
				needsRemoving = this._needsRemoving,
				thisNeedsRemoving, i, j;

			if (this._topClusterLevel) {
				this._topClusterLevel.getAllChildMarkers(markers);
			}

			for (i = markers.length - 1; i >= 0; i--) {
				thisNeedsRemoving = true;

				for (j = needsRemoving.length - 1; j >= 0; j--) {
					if (needsRemoving[j].layer === markers[i]) {
						thisNeedsRemoving = false;
						break;
					}
				}

				if (thisNeedsRemoving) {
					method.call(context, markers[i]);
				}
			}

			this._nonPointGroup.eachLayer(method, context);
		},

		//Overrides LayerGroup.getLayers
		getLayers: function () {
			var layers = [];
			this.eachLayer(function (l) {
				layers.push(l);
			});
			return layers;
		},

		//Overrides LayerGroup.getLayer, WARNING: Really bad performance
		getLayer: function (id) {
			var result = null;

			id = parseInt(id, 10);

			this.eachLayer(function (l) {
				if (L.stamp(l) === id) {
					result = l;
				}
			});

			return result;
		},

		//Returns true if the given layer is in this MarkerClusterGroup
		hasLayer: function (layer) {
			if (!layer) {
				return false;
			}

			var i, anArray = this._needsClustering;

			for (i = anArray.length - 1; i >= 0; i--) {
				if (anArray[i] === layer) {
					return true;
				}
			}

			anArray = this._needsRemoving;
			for (i = anArray.length - 1; i >= 0; i--) {
				if (anArray[i].layer === layer) {
					return false;
				}
			}

			return !!(layer.__parent && layer.__parent._group === this) || this._nonPointGroup.hasLayer(layer);
		},

		//Zoom down to show the given layer (spiderfying if necessary) then calls the callback
		zoomToShowLayer: function (layer, callback) {

			var map = this._map;

			if (typeof callback !== 'function') {
				callback = function () {};
			}

			var showMarker = function () {
				// Assumes that map.hasLayer checks for direct appearance on map, not recursively calling
				// hasLayer on Layer Groups that are on map (typically not calling this MarkerClusterGroup.hasLayer, which would always return true)
				if ((map.hasLayer(layer) || map.hasLayer(layer.__parent)) && !this._inZoomAnimation) {
					this._map.off('moveend', showMarker, this);
					this.off('animationend', showMarker, this);

					if (map.hasLayer(layer)) {
						callback();
					} else if (layer.__parent._icon) {
						this.once('spiderfied', callback, this);
						layer.__parent.spiderfy();
					}
				}
			};

			if (layer._icon && this._map.getBounds().contains(layer.getLatLng())) {
				//Layer is visible ond on screen, immediate return
				callback();
			} else if (layer.__parent._zoom < Math.round(this._map._zoom)) {
				//Layer should be visible at this zoom level. It must not be on screen so just pan over to it
				this._map.on('moveend', showMarker, this);
				this._map.panTo(layer.getLatLng());
			} else {
				this._map.on('moveend', showMarker, this);
				this.on('animationend', showMarker, this);
				layer.__parent.zoomToBounds();
			}
		},

		//Overrides FeatureGroup.onAdd
		onAdd: function (map) {
			this._map = map;
			var i, l, layer;

			if (!isFinite(this._map.getMaxZoom())) {
				throw "Map has no maxZoom specified";
			}

			this._featureGroup.addTo(map);
			this._nonPointGroup.addTo(map);

			if (!this._gridClusters) {
				this._generateInitialClusters();
			}

			this._maxLat = map.options.crs.projection.MAX_LATITUDE;

			//Restore all the positions as they are in the MCG before removing them
			for (i = 0, l = this._needsRemoving.length; i < l; i++) {
				layer = this._needsRemoving[i];
				layer.newlatlng = layer.layer._latlng;
				layer.layer._latlng = layer.latlng;
			}
			//Remove them, then restore their new positions
			for (i = 0, l = this._needsRemoving.length; i < l; i++) {
				layer = this._needsRemoving[i];
				this._removeLayer(layer.layer, true);
				layer.layer._latlng = layer.newlatlng;
			}
			this._needsRemoving = [];

			//Remember the current zoom level and bounds
			this._zoom = Math.round(this._map._zoom);
			this._currentShownBounds = this._getExpandedVisibleBounds();

			this._map.on('zoomend', this._zoomEnd, this);
			this._map.on('moveend', this._moveEnd, this);

			if (this._spiderfierOnAdd) { //TODO FIXME: Not sure how to have spiderfier add something on here nicely
				this._spiderfierOnAdd();
			}

			this._bindEvents();

			//Actually add our markers to the map:
			l = this._needsClustering;
			this._needsClustering = [];
			this.addLayers(l, true);
		},

		//Overrides FeatureGroup.onRemove
		onRemove: function (map) {
			map.off('zoomend', this._zoomEnd, this);
			map.off('moveend', this._moveEnd, this);

			this._unbindEvents();

			//In case we are in a cluster animation
			this._map._mapPane.className = this._map._mapPane.className.replace(' leaflet-cluster-anim', '');

			if (this._spiderfierOnRemove) { //TODO FIXME: Not sure how to have spiderfier add something on here nicely
				this._spiderfierOnRemove();
			}

			delete this._maxLat;

			//Clean up all the layers we added to the map
			this._hideCoverage();
			this._featureGroup.remove();
			this._nonPointGroup.remove();

			this._featureGroup.clearLayers();

			this._map = null;
		},

		getVisibleParent: function (marker) {
			var vMarker = marker;
			while (vMarker && !vMarker._icon) {
				vMarker = vMarker.__parent;
			}
			return vMarker || null;
		},

		//Remove the given object from the given array
		_arraySplice: function (anArray, obj) {
			for (var i = anArray.length - 1; i >= 0; i--) {
				if (anArray[i] === obj) {
					anArray.splice(i, 1);
					return true;
				}
			}
		},

		/**
		 * Removes a marker from all _gridUnclustered zoom levels, starting at the supplied zoom.
		 * @param marker to be removed from _gridUnclustered.
		 * @param z integer bottom start zoom level (included)
		 * @private
		 */
		_removeFromGridUnclustered: function (marker, z) {
			var map = this._map,
			    gridUnclustered = this._gridUnclustered,
				minZoom = Math.floor(this._map.getMinZoom());

			for (; z >= minZoom; z--) {
				if (!gridUnclustered[z].removeObject(marker, map.project(marker.getLatLng(), z))) {
					break;
				}
			}
		},

		_childMarkerDragStart: function (e) {
			e.target.__dragStart = e.target._latlng;
		},

		_childMarkerMoved: function (e) {
			if (!this._ignoreMove && !e.target.__dragStart) {
				var isPopupOpen = e.target._popup && e.target._popup.isOpen();

				this._moveChild(e.target, e.oldLatLng, e.latlng);

				if (isPopupOpen) {
					e.target.openPopup();
				}
			}
		},

		_moveChild: function (layer, from, to) {
			layer._latlng = from;
			this.removeLayer(layer);

			layer._latlng = to;
			this.addLayer(layer);
		},

		_childMarkerDragEnd: function (e) {
			var dragStart = e.target.__dragStart;
			delete e.target.__dragStart;
			if (dragStart) {
				this._moveChild(e.target, dragStart, e.target._latlng);
			}		
		},


		//Internal function for removing a marker from everything.
		//dontUpdateMap: set to true if you will handle updating the map manually (for bulk functions)
		_removeLayer: function (marker, removeFromDistanceGrid, dontUpdateMap) {
			var gridClusters = this._gridClusters,
				gridUnclustered = this._gridUnclustered,
				fg = this._featureGroup,
				map = this._map,
				minZoom = Math.floor(this._map.getMinZoom());

			//Remove the marker from distance clusters it might be in
			if (removeFromDistanceGrid) {
				this._removeFromGridUnclustered(marker, this._maxZoom);
			}

			//Work our way up the clusters removing them as we go if required
			var cluster = marker.__parent,
				markers = cluster._markers,
				otherMarker;

			//Remove the marker from the immediate parents marker list
			this._arraySplice(markers, marker);

			while (cluster) {
				cluster._childCount--;
				cluster._boundsNeedUpdate = true;

				if (cluster._zoom < minZoom) {
					//Top level, do nothing
					break;
				} else if (removeFromDistanceGrid && cluster._childCount <= 1) { //Cluster no longer required
					//We need to push the other marker up to the parent
					otherMarker = cluster._markers[0] === marker ? cluster._markers[1] : cluster._markers[0];

					//Update distance grid
					gridClusters[cluster._zoom].removeObject(cluster, map.project(cluster._cLatLng, cluster._zoom));
					gridUnclustered[cluster._zoom].addObject(otherMarker, map.project(otherMarker.getLatLng(), cluster._zoom));

					//Move otherMarker up to parent
					this._arraySplice(cluster.__parent._childClusters, cluster);
					cluster.__parent._markers.push(otherMarker);
					otherMarker.__parent = cluster.__parent;

					if (cluster._icon) {
						//Cluster is currently on the map, need to put the marker on the map instead
						fg.removeLayer(cluster);
						if (!dontUpdateMap) {
							fg.addLayer(otherMarker);
						}
					}
				} else {
					cluster._iconNeedsUpdate = true;
				}

				cluster = cluster.__parent;
			}

			delete marker.__parent;
		},

		_isOrIsParent: function (el, oel) {
			while (oel) {
				if (el === oel) {
					return true;
				}
				oel = oel.parentNode;
			}
			return false;
		},

		//Override L.Evented.fire
		fire: function (type, data, propagate) {
			if (data && data.layer instanceof L.MarkerCluster) {
				//Prevent multiple clustermouseover/off events if the icon is made up of stacked divs (Doesn't work in ie <= 8, no relatedTarget)
				if (data.originalEvent && this._isOrIsParent(data.layer._icon, data.originalEvent.relatedTarget)) {
					return;
				}
				type = 'cluster' + type;
			}

			L.FeatureGroup.prototype.fire.call(this, type, data, propagate);
		},

		//Override L.Evented.listens
		listens: function (type, propagate) {
			return L.FeatureGroup.prototype.listens.call(this, type, propagate) || L.FeatureGroup.prototype.listens.call(this, 'cluster' + type, propagate);
		},

		//Default functionality
		_defaultIconCreateFunction: function (cluster) {
			var childCount = cluster.getChildCount();

			var c = ' marker-cluster-';
			if (childCount < 10) {
				c += 'small';
			} else if (childCount < 100) {
				c += 'medium';
			} else {
				c += 'large';
			}

			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
		},

		_bindEvents: function () {
			var map = this._map,
			    spiderfyOnMaxZoom = this.options.spiderfyOnMaxZoom,
			    showCoverageOnHover = this.options.showCoverageOnHover,
			    zoomToBoundsOnClick = this.options.zoomToBoundsOnClick,
			    spiderfyOnEveryZoom = this.options.spiderfyOnEveryZoom;

			//Zoom on cluster click or spiderfy if we are at the lowest level
			if (spiderfyOnMaxZoom || zoomToBoundsOnClick || spiderfyOnEveryZoom) {
				this.on('clusterclick clusterkeypress', this._zoomOrSpiderfy, this);
			}

			//Show convex hull (boundary) polygon on mouse over
			if (showCoverageOnHover) {
				this.on('clustermouseover', this._showCoverage, this);
				this.on('clustermouseout', this._hideCoverage, this);
				map.on('zoomend', this._hideCoverage, this);
			}
		},

		_zoomOrSpiderfy: function (e) {
			var cluster = e.layer,
			    bottomCluster = cluster;

			if (e.type === 'clusterkeypress' && e.originalEvent && e.originalEvent.keyCode !== 13) {
				return;
			}

			while (bottomCluster._childClusters.length === 1) {
				bottomCluster = bottomCluster._childClusters[0];
			}

			if (bottomCluster._zoom === this._maxZoom &&
				bottomCluster._childCount === cluster._childCount &&
				this.options.spiderfyOnMaxZoom) {

				// All child markers are contained in a single cluster from this._maxZoom to this cluster.
				cluster.spiderfy();
			} else if (this.options.zoomToBoundsOnClick) {
				cluster.zoomToBounds();
			}

			if (this.options.spiderfyOnEveryZoom) {
				cluster.spiderfy();
			}

			// Focus the map again for keyboard users.
			if (e.originalEvent && e.originalEvent.keyCode === 13) {
				this._map._container.focus();
			}
		},

		_showCoverage: function (e) {
			var map = this._map;
			if (this._inZoomAnimation) {
				return;
			}
			if (this._shownPolygon) {
				map.removeLayer(this._shownPolygon);
			}
			if (e.layer.getChildCount() > 2 && e.layer !== this._spiderfied) {
				this._shownPolygon = new L.Polygon(e.layer.getConvexHull(), this.options.polygonOptions);
				map.addLayer(this._shownPolygon);
			}
		},

		_hideCoverage: function () {
			if (this._shownPolygon) {
				this._map.removeLayer(this._shownPolygon);
				this._shownPolygon = null;
			}
		},

		_unbindEvents: function () {
			var spiderfyOnMaxZoom = this.options.spiderfyOnMaxZoom,
				showCoverageOnHover = this.options.showCoverageOnHover,
				zoomToBoundsOnClick = this.options.zoomToBoundsOnClick,
				spiderfyOnEveryZoom = this.options.spiderfyOnEveryZoom,
				map = this._map;

			if (spiderfyOnMaxZoom || zoomToBoundsOnClick || spiderfyOnEveryZoom) {
				this.off('clusterclick clusterkeypress', this._zoomOrSpiderfy, this);
			}
			if (showCoverageOnHover) {
				this.off('clustermouseover', this._showCoverage, this);
				this.off('clustermouseout', this._hideCoverage, this);
				map.off('zoomend', this._hideCoverage, this);
			}
		},

		_zoomEnd: function () {
			if (!this._map) { //May have been removed from the map by a zoomEnd handler
				return;
			}
			this._mergeSplitClusters();

			this._zoom = Math.round(this._map._zoom);
			this._currentShownBounds = this._getExpandedVisibleBounds();
		},

		_moveEnd: function () {
			if (this._inZoomAnimation) {
				return;
			}

			var newBounds = this._getExpandedVisibleBounds();

			this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), this._zoom, newBounds);
			this._topClusterLevel._recursivelyAddChildrenToMap(null, Math.round(this._map._zoom), newBounds);

			this._currentShownBounds = newBounds;
			return;
		},

		_generateInitialClusters: function () {
			var maxZoom = Math.ceil(this._map.getMaxZoom()),
				minZoom = Math.floor(this._map.getMinZoom()),
				radius = this.options.maxClusterRadius,
				radiusFn = radius;

			//If we just set maxClusterRadius to a single number, we need to create
			//a simple function to return that number. Otherwise, we just have to
			//use the function we've passed in.
			if (typeof radius !== "function") {
				radiusFn = function () { return radius; };
			}

			if (this.options.disableClusteringAtZoom !== null) {
				maxZoom = this.options.disableClusteringAtZoom - 1;
			}
			this._maxZoom = maxZoom;
			this._gridClusters = {};
			this._gridUnclustered = {};

			//Set up DistanceGrids for each zoom
			for (var zoom = maxZoom; zoom >= minZoom; zoom--) {
				this._gridClusters[zoom] = new L.DistanceGrid(radiusFn(zoom));
				this._gridUnclustered[zoom] = new L.DistanceGrid(radiusFn(zoom));
			}

			// Instantiate the appropriate L.MarkerCluster class (animated or not).
			this._topClusterLevel = new this._markerCluster(this, minZoom - 1);
		},

		//Zoom: Zoom to start adding at (Pass this._maxZoom to start at the bottom)
		_addLayer: function (layer, zoom) {
			var gridClusters = this._gridClusters,
			    gridUnclustered = this._gridUnclustered,
				minZoom = Math.floor(this._map.getMinZoom()),
			    markerPoint, z;

			if (this.options.singleMarkerMode) {
				this._overrideMarkerIcon(layer);
			}

			layer.on(this._childMarkerEventHandlers, this);

			//Find the lowest zoom level to slot this one in
			for (; zoom >= minZoom; zoom--) {
				markerPoint = this._map.project(layer.getLatLng(), zoom); // calculate pixel position

				//Try find a cluster close by
				var closest = gridClusters[zoom].getNearObject(markerPoint);
				if (closest) {
					closest._addChild(layer);
					layer.__parent = closest;
					return;
				}

				//Try find a marker close by to form a new cluster with
				closest = gridUnclustered[zoom].getNearObject(markerPoint);
				if (closest) {
					var parent = closest.__parent;
					if (parent) {
						this._removeLayer(closest, false);
					}

					//Create new cluster with these 2 in it

					var newCluster = new this._markerCluster(this, zoom, closest, layer);
					gridClusters[zoom].addObject(newCluster, this._map.project(newCluster._cLatLng, zoom));
					closest.__parent = newCluster;
					layer.__parent = newCluster;

					//First create any new intermediate parent clusters that don't exist
					var lastParent = newCluster;
					for (z = zoom - 1; z > parent._zoom; z--) {
						lastParent = new this._markerCluster(this, z, lastParent);
						gridClusters[z].addObject(lastParent, this._map.project(closest.getLatLng(), z));
					}
					parent._addChild(lastParent);

					//Remove closest from this zoom level and any above that it is in, replace with newCluster
					this._removeFromGridUnclustered(closest, zoom);

					return;
				}

				//Didn't manage to cluster in at this zoom, record us as a marker here and continue upwards
				gridUnclustered[zoom].addObject(layer, markerPoint);
			}

			//Didn't get in anything, add us to the top
			this._topClusterLevel._addChild(layer);
			layer.__parent = this._topClusterLevel;
			return;
		},

		/**
		 * Refreshes the icon of all "dirty" visible clusters.
		 * Non-visible "dirty" clusters will be updated when they are added to the map.
		 * @private
		 */
		_refreshClustersIcons: function () {
			this._featureGroup.eachLayer(function (c) {
				if (c instanceof L.MarkerCluster && c._iconNeedsUpdate) {
					c._updateIcon();
				}
			});
		},

		//Enqueue code to fire after the marker expand/contract has happened
		_enqueue: function (fn) {
			this._queue.push(fn);
			if (!this._queueTimeout) {
				this._queueTimeout = setTimeout(L.bind(this._processQueue, this), 300);
			}
		},
		_processQueue: function () {
			for (var i = 0; i < this._queue.length; i++) {
				this._queue[i].call(this);
			}
			this._queue.length = 0;
			clearTimeout(this._queueTimeout);
			this._queueTimeout = null;
		},

		//Merge and split any existing clusters that are too big or small
		_mergeSplitClusters: function () {
			var mapZoom = Math.round(this._map._zoom);

			//In case we are starting to split before the animation finished
			this._processQueue();

			if (this._zoom < mapZoom && this._currentShownBounds.intersects(this._getExpandedVisibleBounds())) { //Zoom in, split
				this._animationStart();
				//Remove clusters now off screen
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), this._zoom, this._getExpandedVisibleBounds());

				this._animationZoomIn(this._zoom, mapZoom);

			} else if (this._zoom > mapZoom) { //Zoom out, merge
				this._animationStart();

				this._animationZoomOut(this._zoom, mapZoom);
			} else {
				this._moveEnd();
			}
		},

		//Gets the maps visible bounds expanded in each direction by the size of the screen (so the user cannot see an area we do not cover in one pan)
		_getExpandedVisibleBounds: function () {
			if (!this.options.removeOutsideVisibleBounds) {
				return this._mapBoundsInfinite;
			} else if (L.Browser.mobile) {
				return this._checkBoundsMaxLat(this._map.getBounds());
			}

			return this._checkBoundsMaxLat(this._map.getBounds().pad(1)); // Padding expands the bounds by its own dimensions but scaled with the given factor.
		},

		/**
		 * Expands the latitude to Infinity (or -Infinity) if the input bounds reach the map projection maximum defined latitude
		 * (in the case of Web/Spherical Mercator, it is 85.0511287798 / see https://en.wikipedia.org/wiki/Web_Mercator#Formulas).
		 * Otherwise, the removeOutsideVisibleBounds option will remove markers beyond that limit, whereas the same markers without
		 * this option (or outside MCG) will have their position floored (ceiled) by the projection and rendered at that limit,
		 * making the user think that MCG "eats" them and never displays them again.
		 * @param bounds L.LatLngBounds
		 * @returns {L.LatLngBounds}
		 * @private
		 */
		_checkBoundsMaxLat: function (bounds) {
			var maxLat = this._maxLat;

			if (maxLat !== undefined) {
				if (bounds.getNorth() >= maxLat) {
					bounds._northEast.lat = Infinity;
				}
				if (bounds.getSouth() <= -maxLat) {
					bounds._southWest.lat = -Infinity;
				}
			}

			return bounds;
		},

		//Shared animation code
		_animationAddLayerNonAnimated: function (layer, newCluster) {
			if (newCluster === layer) {
				this._featureGroup.addLayer(layer);
			} else if (newCluster._childCount === 2) {
				newCluster._addToMap();

				var markers = newCluster.getAllChildMarkers();
				this._featureGroup.removeLayer(markers[0]);
				this._featureGroup.removeLayer(markers[1]);
			} else {
				newCluster._updateIcon();
			}
		},

		/**
		 * Extracts individual (i.e. non-group) layers from a Layer Group.
		 * @param group to extract layers from.
		 * @param output {Array} in which to store the extracted layers.
		 * @returns {*|Array}
		 * @private
		 */
		_extractNonGroupLayers: function (group, output) {
			var layers = group.getLayers(),
			    i = 0,
			    layer;

			output = output || [];

			for (; i < layers.length; i++) {
				layer = layers[i];

				if (layer instanceof L.LayerGroup) {
					this._extractNonGroupLayers(layer, output);
					continue;
				}

				output.push(layer);
			}

			return output;
		},

		/**
		 * Implements the singleMarkerMode option.
		 * @param layer Marker to re-style using the Clusters iconCreateFunction.
		 * @returns {L.Icon} The newly created icon.
		 * @private
		 */
		_overrideMarkerIcon: function (layer) {
			var icon = layer.options.icon = this.options.iconCreateFunction({
				getChildCount: function () {
					return 1;
				},
				getAllChildMarkers: function () {
					return [layer];
				}
			});

			return icon;
		}
	});

	// Constant bounds used in case option "removeOutsideVisibleBounds" is set to false.
	L.MarkerClusterGroup.include({
		_mapBoundsInfinite: new L.LatLngBounds(new L.LatLng(-Infinity, -Infinity), new L.LatLng(Infinity, Infinity))
	});

	L.MarkerClusterGroup.include({
		_noAnimation: {
			//Non Animated versions of everything
			_animationStart: function () {
				//Do nothing...
			},
			_animationZoomIn: function (previousZoomLevel, newZoomLevel) {
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), previousZoomLevel);
				this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());

				//We didn't actually animate, but we use this event to mean "clustering animations have finished"
				this.fire('animationend');
			},
			_animationZoomOut: function (previousZoomLevel, newZoomLevel) {
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), previousZoomLevel);
				this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());

				//We didn't actually animate, but we use this event to mean "clustering animations have finished"
				this.fire('animationend');
			},
			_animationAddLayer: function (layer, newCluster) {
				this._animationAddLayerNonAnimated(layer, newCluster);
			}
		},

		_withAnimation: {
			//Animated versions here
			_animationStart: function () {
				this._map._mapPane.className += ' leaflet-cluster-anim';
				this._inZoomAnimation++;
			},

			_animationZoomIn: function (previousZoomLevel, newZoomLevel) {
				var bounds = this._getExpandedVisibleBounds(),
				    fg = this._featureGroup,
					minZoom = Math.floor(this._map.getMinZoom()),
				    i;

				this._ignoreMove = true;

				//Add all children of current clusters to map and remove those clusters from map
				this._topClusterLevel._recursively(bounds, previousZoomLevel, minZoom, function (c) {
					var startPos = c._latlng,
					    markers  = c._markers,
					    m;

					if (!bounds.contains(startPos)) {
						startPos = null;
					}

					if (c._isSingleParent() && previousZoomLevel + 1 === newZoomLevel) { //Immediately add the new child and remove us
						fg.removeLayer(c);
						c._recursivelyAddChildrenToMap(null, newZoomLevel, bounds);
					} else {
						//Fade out old cluster
						c.clusterHide();
						c._recursivelyAddChildrenToMap(startPos, newZoomLevel, bounds);
					}

					//Remove all markers that aren't visible any more
					//TODO: Do we actually need to do this on the higher levels too?
					for (i = markers.length - 1; i >= 0; i--) {
						m = markers[i];
						if (!bounds.contains(m._latlng)) {
							fg.removeLayer(m);
						}
					}

				});

				this._forceLayout();

				//Update opacities
				this._topClusterLevel._recursivelyBecomeVisible(bounds, newZoomLevel);
				//TODO Maybe? Update markers in _recursivelyBecomeVisible
				fg.eachLayer(function (n) {
					if (!(n instanceof L.MarkerCluster) && n._icon) {
						n.clusterShow();
					}
				});

				//update the positions of the just added clusters/markers
				this._topClusterLevel._recursively(bounds, previousZoomLevel, newZoomLevel, function (c) {
					c._recursivelyRestoreChildPositions(newZoomLevel);
				});

				this._ignoreMove = false;

				//Remove the old clusters and close the zoom animation
				this._enqueue(function () {
					//update the positions of the just added clusters/markers
					this._topClusterLevel._recursively(bounds, previousZoomLevel, minZoom, function (c) {
						fg.removeLayer(c);
						c.clusterShow();
					});

					this._animationEnd();
				});
			},

			_animationZoomOut: function (previousZoomLevel, newZoomLevel) {
				this._animationZoomOutSingle(this._topClusterLevel, previousZoomLevel - 1, newZoomLevel);

				//Need to add markers for those that weren't on the map before but are now
				this._topClusterLevel._recursivelyAddChildrenToMap(null, newZoomLevel, this._getExpandedVisibleBounds());
				//Remove markers that were on the map before but won't be now
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, Math.floor(this._map.getMinZoom()), previousZoomLevel, this._getExpandedVisibleBounds());
			},

			_animationAddLayer: function (layer, newCluster) {
				var me = this,
				    fg = this._featureGroup;

				fg.addLayer(layer);
				if (newCluster !== layer) {
					if (newCluster._childCount > 2) { //Was already a cluster

						newCluster._updateIcon();
						this._forceLayout();
						this._animationStart();

						layer._setPos(this._map.latLngToLayerPoint(newCluster.getLatLng()));
						layer.clusterHide();

						this._enqueue(function () {
							fg.removeLayer(layer);
							layer.clusterShow();

							me._animationEnd();
						});

					} else { //Just became a cluster
						this._forceLayout();

						me._animationStart();
						me._animationZoomOutSingle(newCluster, this._map.getMaxZoom(), this._zoom);
					}
				}
			}
		},

		// Private methods for animated versions.
		_animationZoomOutSingle: function (cluster, previousZoomLevel, newZoomLevel) {
			var bounds = this._getExpandedVisibleBounds(),
				minZoom = Math.floor(this._map.getMinZoom());

			//Animate all of the markers in the clusters to move to their cluster center point
			cluster._recursivelyAnimateChildrenInAndAddSelfToMap(bounds, minZoom, previousZoomLevel + 1, newZoomLevel);

			var me = this;

			//Update the opacity (If we immediately set it they won't animate)
			this._forceLayout();
			cluster._recursivelyBecomeVisible(bounds, newZoomLevel);

			//TODO: Maybe use the transition timing stuff to make this more reliable
			//When the animations are done, tidy up
			this._enqueue(function () {

				//This cluster stopped being a cluster before the timeout fired
				if (cluster._childCount === 1) {
					var m = cluster._markers[0];
					//If we were in a cluster animation at the time then the opacity and position of our child could be wrong now, so fix it
					this._ignoreMove = true;
					m.setLatLng(m.getLatLng());
					this._ignoreMove = false;
					if (m.clusterShow) {
						m.clusterShow();
					}
				} else {
					cluster._recursively(bounds, newZoomLevel, minZoom, function (c) {
						c._recursivelyRemoveChildrenFromMap(bounds, minZoom, previousZoomLevel + 1);
					});
				}
				me._animationEnd();
			});
		},

		_animationEnd: function () {
			if (this._map) {
				this._map._mapPane.className = this._map._mapPane.className.replace(' leaflet-cluster-anim', '');
			}
			this._inZoomAnimation--;
			this.fire('animationend');
		},

		//Force a browser layout of stuff in the map
		// Should apply the current opacity and location to all elements so we can update them again for an animation
		_forceLayout: function () {
			//In my testing this works, infact offsetWidth of any element seems to work.
			//Could loop all this._layers and do this for each _icon if it stops working

			L.Util.falseFn(document.body.offsetWidth);
		}
	});

	L.markerClusterGroup = function (options) {
		return new L.MarkerClusterGroup(options);
	};

	var MarkerCluster = L.MarkerCluster = L.Marker.extend({
		options: L.Icon.prototype.options,

		initialize: function (group, zoom, a, b) {

			L.Marker.prototype.initialize.call(this, a ? (a._cLatLng || a.getLatLng()) : new L.LatLng(0, 0),
	            { icon: this, pane: group.options.clusterPane });

			this._group = group;
			this._zoom = zoom;

			this._markers = [];
			this._childClusters = [];
			this._childCount = 0;
			this._iconNeedsUpdate = true;
			this._boundsNeedUpdate = true;

			this._bounds = new L.LatLngBounds();

			if (a) {
				this._addChild(a);
			}
			if (b) {
				this._addChild(b);
			}
		},

		//Recursively retrieve all child markers of this cluster
		getAllChildMarkers: function (storageArray, ignoreDraggedMarker) {
			storageArray = storageArray || [];

			for (var i = this._childClusters.length - 1; i >= 0; i--) {
				this._childClusters[i].getAllChildMarkers(storageArray, ignoreDraggedMarker);
			}

			for (var j = this._markers.length - 1; j >= 0; j--) {
				if (ignoreDraggedMarker && this._markers[j].__dragStart) {
					continue;
				}
				storageArray.push(this._markers[j]);
			}

			return storageArray;
		},

		//Returns the count of how many child markers we have
		getChildCount: function () {
			return this._childCount;
		},

		//Zoom to the minimum of showing all of the child markers, or the extents of this cluster
		zoomToBounds: function (fitBoundsOptions) {
			var childClusters = this._childClusters.slice(),
				map = this._group._map,
				boundsZoom = map.getBoundsZoom(this._bounds),
				zoom = this._zoom + 1,
				mapZoom = map.getZoom(),
				i;

			//calculate how far we need to zoom down to see all of the markers
			while (childClusters.length > 0 && boundsZoom > zoom) {
				zoom++;
				var newClusters = [];
				for (i = 0; i < childClusters.length; i++) {
					newClusters = newClusters.concat(childClusters[i]._childClusters);
				}
				childClusters = newClusters;
			}

			if (boundsZoom > zoom) {
				this._group._map.setView(this._latlng, zoom);
			} else if (boundsZoom <= mapZoom) { //If fitBounds wouldn't zoom us down, zoom us down instead
				this._group._map.setView(this._latlng, mapZoom + 1);
			} else {
				this._group._map.fitBounds(this._bounds, fitBoundsOptions);
			}
		},

		getBounds: function () {
			var bounds = new L.LatLngBounds();
			bounds.extend(this._bounds);
			return bounds;
		},

		_updateIcon: function () {
			this._iconNeedsUpdate = true;
			if (this._icon) {
				this.setIcon(this);
			}
		},

		//Cludge for Icon, we pretend to be an icon for performance
		createIcon: function () {
			if (this._iconNeedsUpdate) {
				this._iconObj = this._group.options.iconCreateFunction(this);
				this._iconNeedsUpdate = false;
			}
			return this._iconObj.createIcon();
		},
		createShadow: function () {
			return this._iconObj.createShadow();
		},


		_addChild: function (new1, isNotificationFromChild) {

			this._iconNeedsUpdate = true;

			this._boundsNeedUpdate = true;
			this._setClusterCenter(new1);

			if (new1 instanceof L.MarkerCluster) {
				if (!isNotificationFromChild) {
					this._childClusters.push(new1);
					new1.__parent = this;
				}
				this._childCount += new1._childCount;
			} else {
				if (!isNotificationFromChild) {
					this._markers.push(new1);
				}
				this._childCount++;
			}

			if (this.__parent) {
				this.__parent._addChild(new1, true);
			}
		},

		/**
		 * Makes sure the cluster center is set. If not, uses the child center if it is a cluster, or the marker position.
		 * @param child L.MarkerCluster|L.Marker that will be used as cluster center if not defined yet.
		 * @private
		 */
		_setClusterCenter: function (child) {
			if (!this._cLatLng) {
				// when clustering, take position of the first point as the cluster center
				this._cLatLng = child._cLatLng || child._latlng;
			}
		},

		/**
		 * Assigns impossible bounding values so that the next extend entirely determines the new bounds.
		 * This method avoids having to trash the previous L.LatLngBounds object and to create a new one, which is much slower for this class.
		 * As long as the bounds are not extended, most other methods would probably fail, as they would with bounds initialized but not extended.
		 * @private
		 */
		_resetBounds: function () {
			var bounds = this._bounds;

			if (bounds._southWest) {
				bounds._southWest.lat = Infinity;
				bounds._southWest.lng = Infinity;
			}
			if (bounds._northEast) {
				bounds._northEast.lat = -Infinity;
				bounds._northEast.lng = -Infinity;
			}
		},

		_recalculateBounds: function () {
			var markers = this._markers,
			    childClusters = this._childClusters,
			    latSum = 0,
			    lngSum = 0,
			    totalCount = this._childCount,
			    i, child, childLatLng, childCount;

			// Case where all markers are removed from the map and we are left with just an empty _topClusterLevel.
			if (totalCount === 0) {
				return;
			}

			// Reset rather than creating a new object, for performance.
			this._resetBounds();

			// Child markers.
			for (i = 0; i < markers.length; i++) {
				childLatLng = markers[i]._latlng;

				this._bounds.extend(childLatLng);

				latSum += childLatLng.lat;
				lngSum += childLatLng.lng;
			}

			// Child clusters.
			for (i = 0; i < childClusters.length; i++) {
				child = childClusters[i];

				// Re-compute child bounds and weighted position first if necessary.
				if (child._boundsNeedUpdate) {
					child._recalculateBounds();
				}

				this._bounds.extend(child._bounds);

				childLatLng = child._wLatLng;
				childCount = child._childCount;

				latSum += childLatLng.lat * childCount;
				lngSum += childLatLng.lng * childCount;
			}

			this._latlng = this._wLatLng = new L.LatLng(latSum / totalCount, lngSum / totalCount);

			// Reset dirty flag.
			this._boundsNeedUpdate = false;
		},

		//Set our markers position as given and add it to the map
		_addToMap: function (startPos) {
			if (startPos) {
				this._backupLatlng = this._latlng;
				this.setLatLng(startPos);
			}
			this._group._featureGroup.addLayer(this);
		},

		_recursivelyAnimateChildrenIn: function (bounds, center, maxZoom) {
			this._recursively(bounds, this._group._map.getMinZoom(), maxZoom - 1,
				function (c) {
					var markers = c._markers,
						i, m;
					for (i = markers.length - 1; i >= 0; i--) {
						m = markers[i];

						//Only do it if the icon is still on the map
						if (m._icon) {
							m._setPos(center);
							m.clusterHide();
						}
					}
				},
				function (c) {
					var childClusters = c._childClusters,
						j, cm;
					for (j = childClusters.length - 1; j >= 0; j--) {
						cm = childClusters[j];
						if (cm._icon) {
							cm._setPos(center);
							cm.clusterHide();
						}
					}
				}
			);
		},

		_recursivelyAnimateChildrenInAndAddSelfToMap: function (bounds, mapMinZoom, previousZoomLevel, newZoomLevel) {
			this._recursively(bounds, newZoomLevel, mapMinZoom,
				function (c) {
					c._recursivelyAnimateChildrenIn(bounds, c._group._map.latLngToLayerPoint(c.getLatLng()).round(), previousZoomLevel);

					//TODO: depthToAnimateIn affects _isSingleParent, if there is a multizoom we may/may not be.
					//As a hack we only do a animation free zoom on a single level zoom, if someone does multiple levels then we always animate
					if (c._isSingleParent() && previousZoomLevel - 1 === newZoomLevel) {
						c.clusterShow();
						c._recursivelyRemoveChildrenFromMap(bounds, mapMinZoom, previousZoomLevel); //Immediately remove our children as we are replacing them. TODO previousBounds not bounds
					} else {
						c.clusterHide();
					}

					c._addToMap();
				}
			);
		},

		_recursivelyBecomeVisible: function (bounds, zoomLevel) {
			this._recursively(bounds, this._group._map.getMinZoom(), zoomLevel, null, function (c) {
				c.clusterShow();
			});
		},

		_recursivelyAddChildrenToMap: function (startPos, zoomLevel, bounds) {
			this._recursively(bounds, this._group._map.getMinZoom() - 1, zoomLevel,
				function (c) {
					if (zoomLevel === c._zoom) {
						return;
					}

					//Add our child markers at startPos (so they can be animated out)
					for (var i = c._markers.length - 1; i >= 0; i--) {
						var nm = c._markers[i];

						if (!bounds.contains(nm._latlng)) {
							continue;
						}

						if (startPos) {
							nm._backupLatlng = nm.getLatLng();

							nm.setLatLng(startPos);
							if (nm.clusterHide) {
								nm.clusterHide();
							}
						}

						c._group._featureGroup.addLayer(nm);
					}
				},
				function (c) {
					c._addToMap(startPos);
				}
			);
		},

		_recursivelyRestoreChildPositions: function (zoomLevel) {
			//Fix positions of child markers
			for (var i = this._markers.length - 1; i >= 0; i--) {
				var nm = this._markers[i];
				if (nm._backupLatlng) {
					nm.setLatLng(nm._backupLatlng);
					delete nm._backupLatlng;
				}
			}

			if (zoomLevel - 1 === this._zoom) {
				//Reposition child clusters
				for (var j = this._childClusters.length - 1; j >= 0; j--) {
					this._childClusters[j]._restorePosition();
				}
			} else {
				for (var k = this._childClusters.length - 1; k >= 0; k--) {
					this._childClusters[k]._recursivelyRestoreChildPositions(zoomLevel);
				}
			}
		},

		_restorePosition: function () {
			if (this._backupLatlng) {
				this.setLatLng(this._backupLatlng);
				delete this._backupLatlng;
			}
		},

		//exceptBounds: If set, don't remove any markers/clusters in it
		_recursivelyRemoveChildrenFromMap: function (previousBounds, mapMinZoom, zoomLevel, exceptBounds) {
			var m, i;
			this._recursively(previousBounds, mapMinZoom - 1, zoomLevel - 1,
				function (c) {
					//Remove markers at every level
					for (i = c._markers.length - 1; i >= 0; i--) {
						m = c._markers[i];
						if (!exceptBounds || !exceptBounds.contains(m._latlng)) {
							c._group._featureGroup.removeLayer(m);
							if (m.clusterShow) {
								m.clusterShow();
							}
						}
					}
				},
				function (c) {
					//Remove child clusters at just the bottom level
					for (i = c._childClusters.length - 1; i >= 0; i--) {
						m = c._childClusters[i];
						if (!exceptBounds || !exceptBounds.contains(m._latlng)) {
							c._group._featureGroup.removeLayer(m);
							if (m.clusterShow) {
								m.clusterShow();
							}
						}
					}
				}
			);
		},

		//Run the given functions recursively to this and child clusters
		// boundsToApplyTo: a L.LatLngBounds representing the bounds of what clusters to recurse in to
		// zoomLevelToStart: zoom level to start running functions (inclusive)
		// zoomLevelToStop: zoom level to stop running functions (inclusive)
		// runAtEveryLevel: function that takes an L.MarkerCluster as an argument that should be applied on every level
		// runAtBottomLevel: function that takes an L.MarkerCluster as an argument that should be applied at only the bottom level
		_recursively: function (boundsToApplyTo, zoomLevelToStart, zoomLevelToStop, runAtEveryLevel, runAtBottomLevel) {
			var childClusters = this._childClusters,
			    zoom = this._zoom,
			    i, c;

			if (zoomLevelToStart <= zoom) {
				if (runAtEveryLevel) {
					runAtEveryLevel(this);
				}
				if (runAtBottomLevel && zoom === zoomLevelToStop) {
					runAtBottomLevel(this);
				}
			}

			if (zoom < zoomLevelToStart || zoom < zoomLevelToStop) {
				for (i = childClusters.length - 1; i >= 0; i--) {
					c = childClusters[i];
					if (c._boundsNeedUpdate) {
						c._recalculateBounds();
					}
					if (boundsToApplyTo.intersects(c._bounds)) {
						c._recursively(boundsToApplyTo, zoomLevelToStart, zoomLevelToStop, runAtEveryLevel, runAtBottomLevel);
					}
				}
			}
		},

		//Returns true if we are the parent of only one cluster and that cluster is the same as us
		_isSingleParent: function () {
			//Don't need to check this._markers as the rest won't work if there are any
			return this._childClusters.length > 0 && this._childClusters[0]._childCount === this._childCount;
		}
	});

	/*
	* Extends L.Marker to include two extra methods: clusterHide and clusterShow.
	* 
	* They work as setOpacity(0) and setOpacity(1) respectively, but
	* don't overwrite the options.opacity
	* 
	*/

	L.Marker.include({
		clusterHide: function () {
			var backup = this.options.opacity;
			this.setOpacity(0);
			this.options.opacity = backup;
			return this;
		},
		
		clusterShow: function () {
			return this.setOpacity(this.options.opacity);
		}
	});

	L.DistanceGrid = function (cellSize) {
		this._cellSize = cellSize;
		this._sqCellSize = cellSize * cellSize;
		this._grid = {};
		this._objectPoint = { };
	};

	L.DistanceGrid.prototype = {

		addObject: function (obj, point) {
			var x = this._getCoord(point.x),
			    y = this._getCoord(point.y),
			    grid = this._grid,
			    row = grid[y] = grid[y] || {},
			    cell = row[x] = row[x] || [],
			    stamp = L.Util.stamp(obj);

			this._objectPoint[stamp] = point;

			cell.push(obj);
		},

		updateObject: function (obj, point) {
			this.removeObject(obj);
			this.addObject(obj, point);
		},

		//Returns true if the object was found
		removeObject: function (obj, point) {
			var x = this._getCoord(point.x),
			    y = this._getCoord(point.y),
			    grid = this._grid,
			    row = grid[y] = grid[y] || {},
			    cell = row[x] = row[x] || [],
			    i, len;

			delete this._objectPoint[L.Util.stamp(obj)];

			for (i = 0, len = cell.length; i < len; i++) {
				if (cell[i] === obj) {

					cell.splice(i, 1);

					if (len === 1) {
						delete row[x];
					}

					return true;
				}
			}

		},

		eachObject: function (fn, context) {
			var i, j, k, len, row, cell, removed,
			    grid = this._grid;

			for (i in grid) {
				row = grid[i];

				for (j in row) {
					cell = row[j];

					for (k = 0, len = cell.length; k < len; k++) {
						removed = fn.call(context, cell[k]);
						if (removed) {
							k--;
							len--;
						}
					}
				}
			}
		},

		getNearObject: function (point) {
			var x = this._getCoord(point.x),
			    y = this._getCoord(point.y),
			    i, j, k, row, cell, len, obj, dist,
			    objectPoint = this._objectPoint,
			    closestDistSq = this._sqCellSize,
			    closest = null;

			for (i = y - 1; i <= y + 1; i++) {
				row = this._grid[i];
				if (row) {

					for (j = x - 1; j <= x + 1; j++) {
						cell = row[j];
						if (cell) {

							for (k = 0, len = cell.length; k < len; k++) {
								obj = cell[k];
								dist = this._sqDist(objectPoint[L.Util.stamp(obj)], point);
								if (dist < closestDistSq ||
									dist <= closestDistSq && closest === null) {
									closestDistSq = dist;
									closest = obj;
								}
							}
						}
					}
				}
			}
			return closest;
		},

		_getCoord: function (x) {
			var coord = Math.floor(x / this._cellSize);
			return isFinite(coord) ? coord : x;
		},

		_sqDist: function (p, p2) {
			var dx = p2.x - p.x,
			    dy = p2.y - p.y;
			return dx * dx + dy * dy;
		}
	};

	/* Copyright (c) 2012 the authors listed at the following URL, and/or
	the authors of referenced articles or incorporated external code:
	http://en.literateprograms.org/Quickhull_(Javascript)?action=history&offset=20120410175256

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
	CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	Retrieved from: http://en.literateprograms.org/Quickhull_(Javascript)?oldid=18434
	*/

	(function () {
		L.QuickHull = {

			/*
			 * @param {Object} cpt a point to be measured from the baseline
			 * @param {Array} bl the baseline, as represented by a two-element
			 *   array of latlng objects.
			 * @returns {Number} an approximate distance measure
			 */
			getDistant: function (cpt, bl) {
				var vY = bl[1].lat - bl[0].lat,
					vX = bl[0].lng - bl[1].lng;
				return (vX * (cpt.lat - bl[0].lat) + vY * (cpt.lng - bl[0].lng));
			},

			/*
			 * @param {Array} baseLine a two-element array of latlng objects
			 *   representing the baseline to project from
			 * @param {Array} latLngs an array of latlng objects
			 * @returns {Object} the maximum point and all new points to stay
			 *   in consideration for the hull.
			 */
			findMostDistantPointFromBaseLine: function (baseLine, latLngs) {
				var maxD = 0,
					maxPt = null,
					newPoints = [],
					i, pt, d;

				for (i = latLngs.length - 1; i >= 0; i--) {
					pt = latLngs[i];
					d = this.getDistant(pt, baseLine);

					if (d > 0) {
						newPoints.push(pt);
					} else {
						continue;
					}

					if (d > maxD) {
						maxD = d;
						maxPt = pt;
					}
				}

				return { maxPoint: maxPt, newPoints: newPoints };
			},


			/*
			 * Given a baseline, compute the convex hull of latLngs as an array
			 * of latLngs.
			 *
			 * @param {Array} latLngs
			 * @returns {Array}
			 */
			buildConvexHull: function (baseLine, latLngs) {
				var convexHullBaseLines = [],
					t = this.findMostDistantPointFromBaseLine(baseLine, latLngs);

				if (t.maxPoint) { // if there is still a point "outside" the base line
					convexHullBaseLines =
						convexHullBaseLines.concat(
							this.buildConvexHull([baseLine[0], t.maxPoint], t.newPoints)
						);
					convexHullBaseLines =
						convexHullBaseLines.concat(
							this.buildConvexHull([t.maxPoint, baseLine[1]], t.newPoints)
						);
					return convexHullBaseLines;
				} else {  // if there is no more point "outside" the base line, the current base line is part of the convex hull
					return [baseLine[0]];
				}
			},

			/*
			 * Given an array of latlngs, compute a convex hull as an array
			 * of latlngs
			 *
			 * @param {Array} latLngs
			 * @returns {Array}
			 */
			getConvexHull: function (latLngs) {
				// find first baseline
				var maxLat = false, minLat = false,
					maxLng = false, minLng = false,
					maxLatPt = null, minLatPt = null,
					maxLngPt = null, minLngPt = null,
					maxPt = null, minPt = null,
					i;

				for (i = latLngs.length - 1; i >= 0; i--) {
					var pt = latLngs[i];
					if (maxLat === false || pt.lat > maxLat) {
						maxLatPt = pt;
						maxLat = pt.lat;
					}
					if (minLat === false || pt.lat < minLat) {
						minLatPt = pt;
						minLat = pt.lat;
					}
					if (maxLng === false || pt.lng > maxLng) {
						maxLngPt = pt;
						maxLng = pt.lng;
					}
					if (minLng === false || pt.lng < minLng) {
						minLngPt = pt;
						minLng = pt.lng;
					}
				}
				
				if (minLat !== maxLat) {
					minPt = minLatPt;
					maxPt = maxLatPt;
				} else {
					minPt = minLngPt;
					maxPt = maxLngPt;
				}

				var ch = [].concat(this.buildConvexHull([minPt, maxPt], latLngs),
									this.buildConvexHull([maxPt, minPt], latLngs));
				return ch;
			}
		};
	}());

	L.MarkerCluster.include({
		getConvexHull: function () {
			var childMarkers = this.getAllChildMarkers(),
				points = [],
				p, i;

			for (i = childMarkers.length - 1; i >= 0; i--) {
				p = childMarkers[i].getLatLng();
				points.push(p);
			}

			return L.QuickHull.getConvexHull(points);
		}
	});

	//This code is 100% based on https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
	//Huge thanks to jawj for implementing it first to make my job easy :-)

	L.MarkerCluster.include({

		_2PI: Math.PI * 2,
		_circleFootSeparation: 25, //related to circumference of circle
		_circleStartAngle: 0,

		_spiralFootSeparation:  28, //related to size of spiral (experiment!)
		_spiralLengthStart: 11,
		_spiralLengthFactor: 5,

		_circleSpiralSwitchover: 9, //show spiral instead of circle from this marker count upwards.
									// 0 -> always spiral; Infinity -> always circle

		spiderfy: function () {
			if (this._group._spiderfied === this || this._group._inZoomAnimation) {
				return;
			}

			var childMarkers = this.getAllChildMarkers(null, true),
				group = this._group,
				map = group._map,
				center = map.latLngToLayerPoint(this._latlng),
				positions;

			this._group._unspiderfy();
			this._group._spiderfied = this;

			//TODO Maybe: childMarkers order by distance to center

			if (this._group.options.spiderfyShapePositions) {
				positions = this._group.options.spiderfyShapePositions(childMarkers.length, center);
			} else if (childMarkers.length >= this._circleSpiralSwitchover) {
				positions = this._generatePointsSpiral(childMarkers.length, center);
			} else {
				center.y += 10; // Otherwise circles look wrong => hack for standard blue icon, renders differently for other icons.
				positions = this._generatePointsCircle(childMarkers.length, center);
			}

			this._animationSpiderfy(childMarkers, positions);
		},

		unspiderfy: function (zoomDetails) {
			/// <param Name="zoomDetails">Argument from zoomanim if being called in a zoom animation or null otherwise</param>
			if (this._group._inZoomAnimation) {
				return;
			}
			this._animationUnspiderfy(zoomDetails);

			this._group._spiderfied = null;
		},

		_generatePointsCircle: function (count, centerPt) {
			var circumference = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count),
				legLength = circumference / this._2PI,  //radius from circumference
				angleStep = this._2PI / count,
				res = [],
				i, angle;

			legLength = Math.max(legLength, 35); // Minimum distance to get outside the cluster icon.

			res.length = count;

			for (i = 0; i < count; i++) { // Clockwise, like spiral.
				angle = this._circleStartAngle + i * angleStep;
				res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
			}

			return res;
		},

		_generatePointsSpiral: function (count, centerPt) {
			var spiderfyDistanceMultiplier = this._group.options.spiderfyDistanceMultiplier,
				legLength = spiderfyDistanceMultiplier * this._spiralLengthStart,
				separation = spiderfyDistanceMultiplier * this._spiralFootSeparation,
				lengthFactor = spiderfyDistanceMultiplier * this._spiralLengthFactor * this._2PI,
				angle = 0,
				res = [],
				i;

			res.length = count;

			// Higher index, closer position to cluster center.
			for (i = count; i >= 0; i--) {
				// Skip the first position, so that we are already farther from center and we avoid
				// being under the default cluster icon (especially important for Circle Markers).
				if (i < count) {
					res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
				}
				angle += separation / legLength + i * 0.0005;
				legLength += lengthFactor / angle;
			}
			return res;
		},

		_noanimationUnspiderfy: function () {
			var group = this._group,
				map = group._map,
				fg = group._featureGroup,
				childMarkers = this.getAllChildMarkers(null, true),
				m, i;

			group._ignoreMove = true;

			this.setOpacity(1);
			for (i = childMarkers.length - 1; i >= 0; i--) {
				m = childMarkers[i];

				fg.removeLayer(m);

				if (m._preSpiderfyLatlng) {
					m.setLatLng(m._preSpiderfyLatlng);
					delete m._preSpiderfyLatlng;
				}
				if (m.setZIndexOffset) {
					m.setZIndexOffset(0);
				}

				if (m._spiderLeg) {
					map.removeLayer(m._spiderLeg);
					delete m._spiderLeg;
				}
			}

			group.fire('unspiderfied', {
				cluster: this,
				markers: childMarkers
			});
			group._ignoreMove = false;
			group._spiderfied = null;
		}
	});

	//Non Animated versions of everything
	L.MarkerClusterNonAnimated = L.MarkerCluster.extend({
		_animationSpiderfy: function (childMarkers, positions) {
			var group = this._group,
				map = group._map,
				fg = group._featureGroup,
				legOptions = this._group.options.spiderLegPolylineOptions,
				i, m, leg, newPos;

			group._ignoreMove = true;

			// Traverse in ascending order to make sure that inner circleMarkers are on top of further legs. Normal markers are re-ordered by newPosition.
			// The reverse order trick no longer improves performance on modern browsers.
			for (i = 0; i < childMarkers.length; i++) {
				newPos = map.layerPointToLatLng(positions[i]);
				m = childMarkers[i];

				// Add the leg before the marker, so that in case the latter is a circleMarker, the leg is behind it.
				leg = new L.Polyline([this._latlng, newPos], legOptions);
				map.addLayer(leg);
				m._spiderLeg = leg;

				// Now add the marker.
				m._preSpiderfyLatlng = m._latlng;
				m.setLatLng(newPos);
				if (m.setZIndexOffset) {
					m.setZIndexOffset(1000000); //Make these appear on top of EVERYTHING
				}

				fg.addLayer(m);
			}
			this.setOpacity(0.3);

			group._ignoreMove = false;
			group.fire('spiderfied', {
				cluster: this,
				markers: childMarkers
			});
		},

		_animationUnspiderfy: function () {
			this._noanimationUnspiderfy();
		}
	});

	//Animated versions here
	L.MarkerCluster.include({

		_animationSpiderfy: function (childMarkers, positions) {
			var me = this,
				group = this._group,
				map = group._map,
				fg = group._featureGroup,
				thisLayerLatLng = this._latlng,
				thisLayerPos = map.latLngToLayerPoint(thisLayerLatLng),
				svg = L.Path.SVG,
				legOptions = L.extend({}, this._group.options.spiderLegPolylineOptions), // Copy the options so that we can modify them for animation.
				finalLegOpacity = legOptions.opacity,
				i, m, leg, legPath, legLength, newPos;

			if (finalLegOpacity === undefined) {
				finalLegOpacity = L.MarkerClusterGroup.prototype.options.spiderLegPolylineOptions.opacity;
			}

			if (svg) {
				// If the initial opacity of the spider leg is not 0 then it appears before the animation starts.
				legOptions.opacity = 0;

				// Add the class for CSS transitions.
				legOptions.className = (legOptions.className || '') + ' leaflet-cluster-spider-leg';
			} else {
				// Make sure we have a defined opacity.
				legOptions.opacity = finalLegOpacity;
			}

			group._ignoreMove = true;

			// Add markers and spider legs to map, hidden at our center point.
			// Traverse in ascending order to make sure that inner circleMarkers are on top of further legs. Normal markers are re-ordered by newPosition.
			// The reverse order trick no longer improves performance on modern browsers.
			for (i = 0; i < childMarkers.length; i++) {
				m = childMarkers[i];

				newPos = map.layerPointToLatLng(positions[i]);

				// Add the leg before the marker, so that in case the latter is a circleMarker, the leg is behind it.
				leg = new L.Polyline([thisLayerLatLng, newPos], legOptions);
				map.addLayer(leg);
				m._spiderLeg = leg;

				// Explanations: https://jakearchibald.com/2013/animated-line-drawing-svg/
				// In our case the transition property is declared in the CSS file.
				if (svg) {
					legPath = leg._path;
					legLength = legPath.getTotalLength() + 0.1; // Need a small extra length to avoid remaining dot in Firefox.
					legPath.style.strokeDasharray = legLength; // Just 1 length is enough, it will be duplicated.
					legPath.style.strokeDashoffset = legLength;
				}

				// If it is a marker, add it now and we'll animate it out
				if (m.setZIndexOffset) {
					m.setZIndexOffset(1000000); // Make normal markers appear on top of EVERYTHING
				}
				if (m.clusterHide) {
					m.clusterHide();
				}
				
				// Vectors just get immediately added
				fg.addLayer(m);

				if (m._setPos) {
					m._setPos(thisLayerPos);
				}
			}

			group._forceLayout();
			group._animationStart();

			// Reveal markers and spider legs.
			for (i = childMarkers.length - 1; i >= 0; i--) {
				newPos = map.layerPointToLatLng(positions[i]);
				m = childMarkers[i];

				//Move marker to new position
				m._preSpiderfyLatlng = m._latlng;
				m.setLatLng(newPos);
				
				if (m.clusterShow) {
					m.clusterShow();
				}

				// Animate leg (animation is actually delegated to CSS transition).
				if (svg) {
					leg = m._spiderLeg;
					legPath = leg._path;
					legPath.style.strokeDashoffset = 0;
					//legPath.style.strokeOpacity = finalLegOpacity;
					leg.setStyle({opacity: finalLegOpacity});
				}
			}
			this.setOpacity(0.3);

			group._ignoreMove = false;

			setTimeout(function () {
				group._animationEnd();
				group.fire('spiderfied', {
					cluster: me,
					markers: childMarkers
				});
			}, 200);
		},

		_animationUnspiderfy: function (zoomDetails) {
			var me = this,
				group = this._group,
				map = group._map,
				fg = group._featureGroup,
				thisLayerPos = zoomDetails ? map._latLngToNewLayerPoint(this._latlng, zoomDetails.zoom, zoomDetails.center) : map.latLngToLayerPoint(this._latlng),
				childMarkers = this.getAllChildMarkers(null, true),
				svg = L.Path.SVG,
				m, i, leg, legPath, legLength, nonAnimatable;

			group._ignoreMove = true;
			group._animationStart();

			//Make us visible and bring the child markers back in
			this.setOpacity(1);
			for (i = childMarkers.length - 1; i >= 0; i--) {
				m = childMarkers[i];

				//Marker was added to us after we were spiderfied
				if (!m._preSpiderfyLatlng) {
					continue;
				}

				//Close any popup on the marker first, otherwise setting the location of the marker will make the map scroll
				m.closePopup();

				//Fix up the location to the real one
				m.setLatLng(m._preSpiderfyLatlng);
				delete m._preSpiderfyLatlng;

				//Hack override the location to be our center
				nonAnimatable = true;
				if (m._setPos) {
					m._setPos(thisLayerPos);
					nonAnimatable = false;
				}
				if (m.clusterHide) {
					m.clusterHide();
					nonAnimatable = false;
				}
				if (nonAnimatable) {
					fg.removeLayer(m);
				}

				// Animate the spider leg back in (animation is actually delegated to CSS transition).
				if (svg) {
					leg = m._spiderLeg;
					legPath = leg._path;
					legLength = legPath.getTotalLength() + 0.1;
					legPath.style.strokeDashoffset = legLength;
					leg.setStyle({opacity: 0});
				}
			}

			group._ignoreMove = false;

			setTimeout(function () {
				//If we have only <= one child left then that marker will be shown on the map so don't remove it!
				var stillThereChildCount = 0;
				for (i = childMarkers.length - 1; i >= 0; i--) {
					m = childMarkers[i];
					if (m._spiderLeg) {
						stillThereChildCount++;
					}
				}


				for (i = childMarkers.length - 1; i >= 0; i--) {
					m = childMarkers[i];

					if (!m._spiderLeg) { //Has already been unspiderfied
						continue;
					}

					if (m.clusterShow) {
						m.clusterShow();
					}
					if (m.setZIndexOffset) {
						m.setZIndexOffset(0);
					}

					if (stillThereChildCount > 1) {
						fg.removeLayer(m);
					}

					map.removeLayer(m._spiderLeg);
					delete m._spiderLeg;
				}
				group._animationEnd();
				group.fire('unspiderfied', {
					cluster: me,
					markers: childMarkers
				});
			}, 200);
		}
	});


	L.MarkerClusterGroup.include({
		//The MarkerCluster currently spiderfied (if any)
		_spiderfied: null,

		unspiderfy: function () {
			this._unspiderfy.apply(this, arguments);
		},

		_spiderfierOnAdd: function () {
			this._map.on('click', this._unspiderfyWrapper, this);

			if (this._map.options.zoomAnimation) {
				this._map.on('zoomstart', this._unspiderfyZoomStart, this);
			}
			//Browsers without zoomAnimation or a big zoom don't fire zoomstart
			this._map.on('zoomend', this._noanimationUnspiderfy, this);

			if (!L.Browser.touch) {
				this._map.getRenderer(this);
				//Needs to happen in the pageload, not after, or animations don't work in webkit
				//  http://stackoverflow.com/questions/8455200/svg-animate-with-dynamically-added-elements
				//Disable on touch browsers as the animation messes up on a touch zoom and isn't very noticable
			}
		},

		_spiderfierOnRemove: function () {
			this._map.off('click', this._unspiderfyWrapper, this);
			this._map.off('zoomstart', this._unspiderfyZoomStart, this);
			this._map.off('zoomanim', this._unspiderfyZoomAnim, this);
			this._map.off('zoomend', this._noanimationUnspiderfy, this);

			//Ensure that markers are back where they should be
			// Use no animation to avoid a sticky leaflet-cluster-anim class on mapPane
			this._noanimationUnspiderfy();
		},

		//On zoom start we add a zoomanim handler so that we are guaranteed to be last (after markers are animated)
		//This means we can define the animation they do rather than Markers doing an animation to their actual location
		_unspiderfyZoomStart: function () {
			if (!this._map) { //May have been removed from the map by a zoomEnd handler
				return;
			}

			this._map.on('zoomanim', this._unspiderfyZoomAnim, this);
		},

		_unspiderfyZoomAnim: function (zoomDetails) {
			//Wait until the first zoomanim after the user has finished touch-zooming before running the animation
			if (L.DomUtil.hasClass(this._map._mapPane, 'leaflet-touching')) {
				return;
			}

			this._map.off('zoomanim', this._unspiderfyZoomAnim, this);
			this._unspiderfy(zoomDetails);
		},

		_unspiderfyWrapper: function () {
			/// <summary>_unspiderfy but passes no arguments</summary>
			this._unspiderfy();
		},

		_unspiderfy: function (zoomDetails) {
			if (this._spiderfied) {
				this._spiderfied.unspiderfy(zoomDetails);
			}
		},

		_noanimationUnspiderfy: function () {
			if (this._spiderfied) {
				this._spiderfied._noanimationUnspiderfy();
			}
		},

		//If the given layer is currently being spiderfied then we unspiderfy it so it isn't on the map anymore etc
		_unspiderfyLayer: function (layer) {
			if (layer._spiderLeg) {
				this._featureGroup.removeLayer(layer);

				if (layer.clusterShow) {
					layer.clusterShow();
				}
					//Position will be fixed up immediately in _animationUnspiderfy
				if (layer.setZIndexOffset) {
					layer.setZIndexOffset(0);
				}

				this._map.removeLayer(layer._spiderLeg);
				delete layer._spiderLeg;
			}
		}
	});

	/**
	 * Adds 1 public method to MCG and 1 to L.Marker to facilitate changing
	 * markers' icon options and refreshing their icon and their parent clusters
	 * accordingly (case where their iconCreateFunction uses data of childMarkers
	 * to make up the cluster icon).
	 */


	L.MarkerClusterGroup.include({
		/**
		 * Updates the icon of all clusters which are parents of the given marker(s).
		 * In singleMarkerMode, also updates the given marker(s) icon.
		 * @param layers L.MarkerClusterGroup|L.LayerGroup|Array(L.Marker)|Map(L.Marker)|
		 * L.MarkerCluster|L.Marker (optional) list of markers (or single marker) whose parent
		 * clusters need to be updated. If not provided, retrieves all child markers of this.
		 * @returns {L.MarkerClusterGroup}
		 */
		refreshClusters: function (layers) {
			if (!layers) {
				layers = this._topClusterLevel.getAllChildMarkers();
			} else if (layers instanceof L.MarkerClusterGroup) {
				layers = layers._topClusterLevel.getAllChildMarkers();
			} else if (layers instanceof L.LayerGroup) {
				layers = layers._layers;
			} else if (layers instanceof L.MarkerCluster) {
				layers = layers.getAllChildMarkers();
			} else if (layers instanceof L.Marker) {
				layers = [layers];
			} // else: must be an Array(L.Marker)|Map(L.Marker)
			this._flagParentsIconsNeedUpdate(layers);
			this._refreshClustersIcons();

			// In case of singleMarkerMode, also re-draw the markers.
			if (this.options.singleMarkerMode) {
				this._refreshSingleMarkerModeMarkers(layers);
			}

			return this;
		},

		/**
		 * Simply flags all parent clusters of the given markers as having a "dirty" icon.
		 * @param layers Array(L.Marker)|Map(L.Marker) list of markers.
		 * @private
		 */
		_flagParentsIconsNeedUpdate: function (layers) {
			var id, parent;

			// Assumes layers is an Array or an Object whose prototype is non-enumerable.
			for (id in layers) {
				// Flag parent clusters' icon as "dirty", all the way up.
				// Dumb process that flags multiple times upper parents, but still
				// much more efficient than trying to be smart and make short lists,
				// at least in the case of a hierarchy following a power law:
				// http://jsperf.com/flag-nodes-in-power-hierarchy/2
				parent = layers[id].__parent;
				while (parent) {
					parent._iconNeedsUpdate = true;
					parent = parent.__parent;
				}
			}
		},

		/**
		 * Re-draws the icon of the supplied markers.
		 * To be used in singleMarkerMode only.
		 * @param layers Array(L.Marker)|Map(L.Marker) list of markers.
		 * @private
		 */
		_refreshSingleMarkerModeMarkers: function (layers) {
			var id, layer;

			for (id in layers) {
				layer = layers[id];

				// Make sure we do not override markers that do not belong to THIS group.
				if (this.hasLayer(layer)) {
					// Need to re-create the icon first, then re-draw the marker.
					layer.setIcon(this._overrideMarkerIcon(layer));
				}
			}
		}
	});

	L.Marker.include({
		/**
		 * Updates the given options in the marker's icon and refreshes the marker.
		 * @param options map object of icon options.
		 * @param directlyRefreshClusters boolean (optional) true to trigger
		 * MCG.refreshClustersOf() right away with this single marker.
		 * @returns {L.Marker}
		 */
		refreshIconOptions: function (options, directlyRefreshClusters) {
			var icon = this.options.icon;

			L.setOptions(icon, options);

			this.setIcon(icon);

			// Shortcut to refresh the associated MCG clusters right away.
			// To be used when refreshing a single marker.
			// Otherwise, better use MCG.refreshClusters() once at the end with
			// the list of modified markers.
			if (directlyRefreshClusters && this.__parent) {
				this.__parent._group.refreshClusters(this);
			}

			return this;
		}
	});

	exports.MarkerClusterGroup = MarkerClusterGroup;
	exports.MarkerCluster = MarkerCluster;

	Object.defineProperty(exports, '__esModule', { value: true });

}));


},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js":[function(require,module,exports){
var trailingNewlineRegex = /\n[\s]+$/
var leadingNewlineRegex = /^\n[\s]+/
var trailingSpaceRegex = /[\s]+$/
var leadingSpaceRegex = /^[\s]+/
var multiSpaceRegex = /[\n\s]+/g

var TEXT_TAGS = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'amp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'
]

var VERBATIM_TAGS = [
  'code', 'pre', 'textarea'
]

module.exports = function appendChild (el, childs) {
  if (!Array.isArray(childs)) return

  var nodeName = el.nodeName.toLowerCase()

  var hadText = false
  var value, leader

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      appendChild(el, node)
      continue
    }

    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      typeof node === 'function' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }

    var lastChild = el.childNodes[el.childNodes.length - 1]

    // Iterate over text nodes
    if (typeof node === 'string') {
      hadText = true

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === '#text') {
        lastChild.nodeValue += node

      // We didn't have a text node yet, create one
      } else {
        node = document.createTextNode(node)
        el.appendChild(node)
        lastChild = node
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? '' : ' '
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, ' ')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

    // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')

          // Remove empty text nodes, append otherwise
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        // Trim the child nodes if the current node is not a node
        // where all whitespace must be preserved
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, ' ')
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName
      if (_nodeName) nodeName = _nodeName.toLowerCase()

      // Append the node to the DOM
      el.appendChild(node)
    }
  }
}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js":[function(require,module,exports){
var hyperx = require('hyperx')
var appendChild = require('./appendChild')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var COMMENT_TAG = '!--'

var SVG_TAGS = [
  'svg', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter',
  'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src',
  'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph',
  'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS.indexOf(key) !== -1) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  appendChild(el, children)
  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"./appendChild":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js","hyperx":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/csjs.js":[function(require,module,exports){
(function (global){(function (){
'use strict';

var csjs = require('csjs');
var insertCss = require('insert-css');

function csjsInserter() {
  var args = Array.prototype.slice.call(arguments);
  var result = csjs.apply(null, args);
  if (global.document) {
    insertCss(csjs.getCss(result));
  }
  return result;
}

module.exports = csjsInserter;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/index.js","insert-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/insert-css/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/get-css.js":[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/index.js":[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/csjs.js","./get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/csjs.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/csjs.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/index.js":[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/csjs.js","./get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/base62-encode.js":[function(require,module,exports){
'use strict';

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function encode(integer) {
  if (integer === 0) {
    return '0';
  }
  var str = '';
  while (integer > 0) {
    str = CHARS[integer % 62] + str;
    integer = Math.floor(integer / 62);
  }
  return str;
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/build-exports.js":[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

module.exports = function createExports(classes, keyframes, compositions) {
  var keyframesObj = Object.keys(keyframes).reduce(function(acc, key) {
    var val = keyframes[key];
    acc[val] = makeComposition([key], [val], true);
    return acc;
  }, {});

  var exports = Object.keys(classes).reduce(function(acc, key) {
    var val = classes[key];
    var composition = compositions[key];
    var extended = composition ? getClassChain(composition) : [];
    var allClasses = [key].concat(extended);
    var unscoped = allClasses.map(function(name) {
      return classes[name] ? classes[name] : name;
    });
    acc[val] = makeComposition(allClasses, unscoped);
    return acc;
  }, keyframesObj);

  return exports;
}

function getClassChain(obj) {
  var visited = {}, acc = [];

  function traverse(obj) {
    return Object.keys(obj).forEach(function(key) {
      if (!visited[key]) {
        visited[key] = true;
        acc.push(key);
        traverse(obj[key]);
      }
    });
  }

  traverse(obj);
  return acc;
}

},{"./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js":[function(require,module,exports){
'use strict';

module.exports = {
  makeComposition: makeComposition,
  isComposition: isComposition,
  ignoreComposition: ignoreComposition
};

/**
 * Returns an immutable composition object containing the given class names
 * @param  {array} classNames - The input array of class names
 * @return {Composition}      - An immutable object that holds multiple
 *                              representations of the class composition
 */
function makeComposition(classNames, unscoped, isAnimation) {
  var classString = classNames.join(' ');
  return Object.create(Composition.prototype, {
    classNames: { // the original array of class names
      value: Object.freeze(classNames),
      configurable: false,
      writable: false,
      enumerable: true
    },
    unscoped: { // the original array of class names
      value: Object.freeze(unscoped),
      configurable: false,
      writable: false,
      enumerable: true
    },
    className: { // space-separated class string for use in HTML
      value: classString,
      configurable: false,
      writable: false,
      enumerable: true
    },
    selector: { // comma-separated, period-prefixed string for use in CSS
      value: classNames.map(function(name) {
        return isAnimation ? name : '.' + name;
      }).join(', '),
      configurable: false,
      writable: false,
      enumerable: true
    },
    toString: { // toString() method, returns class string for use in HTML
      value: function() {
        return classString;
      },
      configurable: false,
      writeable: false,
      enumerable: false
    }
  });
}

/**
 * Returns whether the input value is a Composition
 * @param value      - value to check
 * @return {boolean} - whether value is a Composition or not
 */
function isComposition(value) {
  return value instanceof Composition;
}

function ignoreComposition(values) {
  return values.reduce(function(acc, val) {
    if (isComposition(val)) {
      val.classNames.forEach(function(name, i) {
        acc[name] = val.unscoped[i];
      });
    }
    return acc;
  }, {});
}

/**
 * Private constructor for use in `instanceof` checks
 */
function Composition() {}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/csjs.js":[function(require,module,exports){
'use strict';

var extractExtends = require('./css-extract-extends');
var composition = require('./composition');
var isComposition = composition.isComposition;
var ignoreComposition = composition.ignoreComposition;
var buildExports = require('./build-exports');
var scopify = require('./scopeify');
var cssKey = require('./css-key');
var extractExports = require('./extract-exports');

module.exports = function csjsTemplate(opts) {
  opts = (typeof opts === 'undefined') ? {} : opts;
  var noscope = (typeof opts.noscope === 'undefined') ? false : opts.noscope;

  return function csjsHandler(strings, values) {
    // Fast path to prevent arguments deopt
    var values = Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      values[i - 1] = arguments[i];
    }
    var css = joiner(strings, values.map(selectorize));
    var ignores = ignoreComposition(values);

    var scope = noscope ? extractExports(css) : scopify(css, ignores);
    var extracted = extractExtends(scope.css);
    var localClasses = without(scope.classes, ignores);
    var localKeyframes = without(scope.keyframes, ignores);
    var compositions = extracted.compositions;

    var exports = buildExports(localClasses, localKeyframes, compositions);

    return Object.defineProperty(exports, cssKey, {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: extracted.css
    });
  }
}

/**
 * Replaces class compositions with comma seperated class selectors
 * @param  value - the potential class composition
 * @return       - the original value or the selectorized class composition
 */
function selectorize(value) {
  return isComposition(value) ? value.selector : value;
}

/**
 * Joins template string literals and values
 * @param  {array} strings - array of strings
 * @param  {array} values  - array of values
 * @return {string}        - strings and values joined
 */
function joiner(strings, values) {
  return strings.map(function(str, i) {
    return (i !== values.length) ? str + values[i] : str;
  }).join('');
}

/**
 * Returns first object without keys of second
 * @param  {object} obj      - source object
 * @param  {object} unwanted - object with unwanted keys
 * @return {object}          - first object without unwanted keys
 */
function without(obj, unwanted) {
  return Object.keys(obj).reduce(function(acc, key) {
    if (!unwanted[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

},{"./build-exports":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/build-exports.js","./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js","./css-extract-extends":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-extract-extends.js","./css-key":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js","./extract-exports":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/extract-exports.js","./scopeify":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scopeify.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-extract-extends.js":[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

var regex = /\.([^\s]+)(\s+)(extends\s+)(\.[^{]+)/g;

module.exports = function extractExtends(css) {
  var found, matches = [];
  while (found = regex.exec(css)) {
    matches.unshift(found);
  }

  function extractCompositions(acc, match) {
    var extendee = getClassName(match[1]);
    var keyword = match[3];
    var extended = match[4];

    // remove from output css
    var index = match.index + match[1].length + match[2].length;
    var len = keyword.length + extended.length;
    acc.css = acc.css.slice(0, index) + " " + acc.css.slice(index + len + 1);

    var extendedClasses = splitter(extended);

    extendedClasses.forEach(function(className) {
      if (!acc.compositions[extendee]) {
        acc.compositions[extendee] = {};
      }
      if (!acc.compositions[className]) {
        acc.compositions[className] = {};
      }
      acc.compositions[extendee][className] = acc.compositions[className];
    });
    return acc;
  }

  return matches.reduce(extractCompositions, {
    css: css,
    compositions: {}
  });

};

function splitter(match) {
  return match.split(',').map(getClassName);
}

function getClassName(str) {
  var trimmed = str.trim();
  return trimmed[0] === '.' ? trimmed.substr(1) : trimmed;
}

},{"./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js":[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/extract-exports.js":[function(require,module,exports){
'use strict';

var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = extractExports;

function extractExports(css) {
  return {
    css: css,
    keyframes: getExport(css, keyframesRegex),
    classes: getExport(css, classRegex)
  };
}

function getExport(css, regex) {
  var prop = {};
  var match;
  while((match = regex.exec(css)) !== null) {
    var name = match[2];
    prop[name] = name;
  }
  return prop;
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/get-css.js":[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/hash-string.js":[function(require,module,exports){
'use strict';

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */

module.exports = function hashStr(str) {
  var hash = 5381;
  var i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0;
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js":[function(require,module,exports){
'use strict';

var findClasses = /(\.)(?!\d)([^\s\.,{\[>+~#:)]*)(?![^{]*})/.source;
var findKeyframes = /(@\S*keyframes\s*)([^{\s]*)/.source;
var ignoreComments = /(?!(?:[^*/]|\*[^/]|\/[^*])*\*+\/)/.source;

var classRegex = new RegExp(findClasses + ignoreComments, 'g');
var keyframesRegex = new RegExp(findKeyframes + ignoreComments, 'g');

module.exports = {
  classRegex: classRegex,
  keyframesRegex: keyframesRegex,
  ignoreComments: ignoreComments,
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/replace-animations.js":[function(require,module,exports){
var ignoreComments = require('./regex').ignoreComments;

module.exports = replaceAnimations;

function replaceAnimations(result) {
  var animations = Object.keys(result.keyframes).reduce(function(acc, key) {
    acc[result.keyframes[key]] = key;
    return acc;
  }, {});
  var unscoped = Object.keys(animations);

  if (unscoped.length) {
    var regexStr = '((?:animation|animation-name)\\s*:[^};]*)('
      + unscoped.join('|') + ')([;\\s])' + ignoreComments;
    var regex = new RegExp(regexStr, 'g');

    var replaced = result.css.replace(regex, function(match, preamble, name, ending) {
      return preamble + animations[name] + ending;
    });

    return {
      css: replaced,
      keyframes: result.keyframes,
      classes: result.classes
    }
  }

  return result;
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scoped-name.js":[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/base62-encode.js","./hash-string":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/hash-string.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scopeify.js":[function(require,module,exports){
'use strict';

var fileScoper = require('./scoped-name');
var replaceAnimations = require('./replace-animations');
var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = scopify;

function scopify(css, ignores) {
  var makeScopedName = fileScoper(css);
  var replacers = {
    classes: classRegex,
    keyframes: keyframesRegex
  };

  function scopeCss(result, key) {
    var replacer = replacers[key];
    function replaceFn(fullMatch, prefix, name) {
      var scopedName = ignores[name] ? name : makeScopedName(name);
      result[key][scopedName] = name;
      return prefix + scopedName;
    }
    return {
      css: result.css.replace(replacer, replaceFn),
      keyframes: result.keyframes,
      classes: result.classes
    };
  }

  var result = Object.keys(replacers).reduce(scopeCss, {
    css: css,
    keyframes: {},
    classes: {}
  });

  return replaceAnimations(result);
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js","./replace-animations":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/replace-animations.js","./scoped-name":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scoped-name.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_img = require('make-image')
const make_element = require('make-element')
const {main_icon, select_icon, list_icon} = require('make-icon')
const make_grid = require('make-grid')

module.exports = {i_button, i_link}

function i_link (opt, protocol) {
    const {page = '*', flow = 'ui-link', name, role='link', body, link = {}, icons = {}, classlist, cover, disabled = false, theme = {}} = opt
    const { icon } = icons
    const make_icon = 'icon' in icons ? main_icon(icon) : undefined
    let {url = '#', target = '_self'} = link
    let is_disabled = disabled

    function widget () {
        const send = protocol(get)
        const make = message_maker(`${name} / ${role} / ${flow} / ${page}`)
        const message = make({to: 'demo.js', type: 'ready'})
        const el = make_element({name: 'i-link', role})
        const shadow = el.attachShadow({mode: 'closed'})
        const text = make_element({name: 'span', classlist: 'text'})
        const avatar = make_element({name: 'span', classlist: 'avatar'})
        text.append(body)
        el.setAttribute('aria-label', body)
        el.setAttribute('href', url)
        if (is_disabled) set_attr ({aria: 'disabled', prop: is_disabled})
        if (!target.match(/self/)) el.setAttribute('target', target)
        if (classlist) el.classList.add(classlist)
        style_sheet(shadow, style)
        // check icon, cover and body if has value
        const add_cover = typeof cover === 'string' ? avatar : undefined
        const add_icon = icon ? make_icon : undefined
        const add_text = body ? typeof body === 'string' && (add_icon || add_cover ) ? text : body : typeof body === 'object' && body.localName === 'div' ? body : undefined
        if (typeof cover === 'string') avatar.append(make_img({src: cover, alt: name}))
        if (typeof cover === 'object') send(make({type: 'error', data: `cover[${typeof cover}] must to be a string`}))
        if (add_icon) shadow.append(make_icon)
        if (add_cover) shadow.append(add_cover)
        if (add_text) shadow.append(add_text)
        send(message)
        if (!is_disabled) el.onclick = handle_open_link
        return el

        function set_attr ({aria, prop}) {
            el.setAttribute(`aria-${aria}`, prop)
        }
    
        function handle_open_link () {
            if (target.match(/_/)) {
                window.open(url, target)
            }
            if (target.match(/#/) && target.length > 1) {
                const el = document.querySelector(target)
                el.src = url
            }
            send(make({type: 'go to', data: {url, window: target}}))
        }

        // protocol get msg
        function get (msg) {
            const { head, refs, type, data } = msg
        }

    }

    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    const {props = {}, grid = {}} = theme
    const {
        // default        
        padding, margin, width, height, opacity,
        // size
        size, size_hover, disabled_size,
        // weight
        weight, weight_hover, disabled_weight,
        // color
        color, color_hover, color_focus, disabled_color,
        // background-color    
        bg_color, bg_color_hover, disabled_bg_color,
        // deco
        deco, deco_hover, disabled_deco,
        // border
        border_width, border_style, border_opacity, 
        border_color, border_color_hover, border_radius,
        // shadowbox
        shadow_color, shadow_color_hover,
        offset_x, offset_y, offset_x_hover, offset_y_hover, 
        blur, blur_hover, shadow_opacity, shadow_opacity_hover,
        // icon
        icon_size, icon_size_hover, disabled_icon_size,
        icon_fill, icon_fill_hover, disabled_icon_fill,
        // avatar
        avatar_width, avatar_height, avatar_radius, 
        avatar_width_hover, avatar_height_hover,
        scale, scale_hover
    } = props

    const grid_link = grid.link ? grid.link : {auto: {auto_flow: 'column'}, align: 'items-center', gap: '4px'}
    const style = `
    :host(i-link) {
        --size: ${size ? size : 'var(--link-size)'};
        --weight: ${weight ? weight : 'var(--weight300)'};
        --color: ${color ? color : 'var(--link-color)'};
        --color-focus: ${color_focus ? color_focus : 'var(--link-color-focus)'};
        --bg-color: ${bg_color ? bg_color : 'var(--link-bg-color)'};
        --opacity: ${opacity ? opacity : '0'};
        --deco: ${deco ? deco : 'none'};
        --padding: ${padding ? padding : '0'};
        --margin: ${margin ? margin : '0'};
        --icon-size: ${icon_size ? icon_size : 'var(--link-icon-size)'};
        display: inline-grid;
        font-size: var(--size);
        font-weight: var(--weight);
        color: hsl(var(--color));
        background-color: hsla(var(--bg-color), var(--opacity));
        text-decoration: var(--deco);
        padding: var(--padding);
        margin: var(--margin);
        transition: color .5s, background-color .5s, font-size .5s, font-weight .5s, opacity .5s ease-in-out;
        cursor: pointer;
        ${make_grid(grid_link)}
    }
    :host(i-link:hover) {
        --color: ${color_hover ? color_hover : 'var(--link-color-hover)'};
        --size: ${size_hover ? size_hover : 'var(--link-size-hover)'};
        --deco: ${deco_hover ? deco_hover : 'underline'};
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--color-white)'};
        --opacity: ${opacity ? opacity : '0'};
        text-decoration: var(--deco);
    }
    :host(i-link:focus) {
        --color: ${color_focus ? color_focus : 'var(--link-color-focus)'};
    }
    :host(i-link) img {
        --scale: ${scale ? scale : '1'};
        width: 100%;
        height: 100%;
        transform: scale(var(--scale));
        transition: transform 0.3s linear;
        object-fit: cover;
        border-radius: var(--avatar-radius);
    }
    :host(i-link:hover) img {
        --scale: ${scale_hover ? scale_hover : '1.2'};
    }
    :host(i-link) svg {
        width: 100%;
        height: auto;
    }
    :host(i-link) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--link-icon-fill)'};
        fill: hsl(var(--icon-fill));
        transition: fill 0.05s ease-in-out;
    }
    :host(i-link:hover) g, :host(i-link:hover) path{
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--link-icon-fill-hover)'};
    }
    :host(i-link) .text {
        ${make_grid(grid.text)}
    }
    :host(i-link) .icon {
        width: var(--icon-size);
        max-width: 100%;
        ${make_grid(grid.icon)}
    }
    :host(i-link:hover) .icon {
        --icon-size: ${icon_size_hover ? icon_size_hover : 'var(--link-icon-size)'};
    }
    :host(i-link) .avatar {
        --avatar-width: ${avatar_width ? avatar_width : 'var(--link-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--link-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--link-avatar-radius)'};
        display: block;
        width: var(--avatar-width);
        height: var(--avatar-height);
        border-radius: var(--avatar-radius);
        -webkit-mask-image: -webkit-radial-gradient(center, white, black);
        max-width: 100%;
        max-height: 100%;
        ${make_grid(grid.avatar)}
        transition: width 0.2s, height 0.2s linear;
    }
    :host(i-link:hover) .avatar {
        --avatar-width: ${avatar_width_hover ? avatar_width_hover : 'var(--link-avatar-width-hover)'};
        --avatar-height: ${avatar_height_hover ? avatar_height_hover : 'var(--link-avatar-height-hover)'};
    }
    :host(i-link[role="menuitem"]) {
        --size: ${size ? size : 'var(--menu-size)'};
        --color: ${color ? color : 'var(--menu-color)'};
        --weight: ${weight ? weight : 'var(--menu-weight)'};
        background-color: transparent;
    }
    :host(i-link[role="menuitem"]:hover) {
        --size: ${size ? size : 'var(--menu-size-hover)'};
        --color: ${color_hover ? color_hover : 'var(--menu-color-hover)'};
        --weight: ${weight ? weight : 'var(--menu-weight-hover)'};
        text-decoration: none;
        background-color: transparent;
    }
    :host(i-link[role="menuitem"]:focus) {
        --color: var(--color-focus);
    }
    :host(i-link[role="menuitem"]) .icon {
        --icon-size: ${icon_size ? icon_size : 'var(--menu-icon-size)'};
    }
    :host(i-link[role="menuitem"]) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--menu-icon-fill)'};
    }
    :host(i-link[role="menuitem"]:hover) g {
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--menu-icon-fill-hover)'};
    }
    :host(i-link[aria-disabled="true"]), :host(i-link[aria-disabled="true"]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--link-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--link-disabled-color)'};
        text-decoration: none;
        cursor: not-allowed;
    }
    :host(i-link[disabled]) g,
    :host(i-link[disabled]) path,
    :host(i-link[disabled]:hover) g,
    :host(i-link[disabled]:hover) path,
    :host(i-link[role][disabled]) g,
    :host(i-link[role][disabled]) path,
    :host(i-link[role][disabled]:hover) g,
    :host(i-link[role][disabled]:hover) path
    {
        --icon-fill: ${disabled_icon_fill ? disabled_icon_fill : 'var(--link-disabled-icon-fill)'};
    }
    :host(i-link[disabled]) .avatar {
        opacity: 0.6;
    }
    :host(i-link.right) {
        flex-direction: row-reverse;
    }
    ${custom_style}
    `
    return widget()
}

function i_button (opt, protocol) {
    const {page = "*", flow = 'ui-button', name, role = 'button', controls, body = '', icons = {}, cover, classlist = null, mode = '', state, expanded = undefined, current = undefined, selected = false, checked = false, disabled = false, theme = {}} = opt
    const {icon, select = {}, list = {}} = icons
    const make_icon = icon ? main_icon(icon) : undefined
    if (role === 'listbox') var make_select_icon = select_icon(select)
    if (role === 'option') var make_list_icon = list_icon(list)
    let is_current = current
    let is_checked = checked
    let is_disabled = disabled
    let is_selected = selected
    let is_expanded = 'expanded' in opt ? expanded : void 0

    function widget () {
        const send = protocol(get)
        const make = message_maker(`${name} / ${role} / ${flow} / ${page}`)
        const data = role === 'tab' ?  {selected: is_current ? 'true' : is_selected, current: is_current} : role === 'switch' ? {checked: is_checked} : role === 'listbox' ? {expanded: is_expanded} : disabled ? {disabled} : role === 'option' ? {selected: is_selected, current: is_current} : null
        const message = make({to: 'demo.js', type: 'ready', data})
        send(message)
        const el = make_element({name: 'i-button', classlist, role })
        const shadow = el.attachShadow({mode: 'closed'})
        const text = make_element({name: 'span', classlist: 'text'})
        const avatar = make_element({name: 'span', classlist: 'avatar'})
        const listbox = make_element({name: 'span', classlist: 'listbox'})
        const option = make_element({name: 'span', classlist: 'option'})
        // check icon, img and body if has value
        const add_cover = typeof cover === 'string' ? avatar : undefined
        const add_text = body ? typeof body === 'object' ? 'undefined' : text : undefined
        if (typeof cover === 'string') avatar.append(make_img({src: cover, alt: name}))
        if (typeof cover === 'object') send(make({type: 'error', data: `cover[${typeof cover}] must to be a string`}))
        if (typeof body === 'object') send(make({type: 'error', data: {body: `content is an ${typeof body}`, content: body }}))
        if (!is_disabled) el.onclick = handle_click
        el.setAttribute('aria-label', name)
        text.append(body)
        style_sheet(shadow, style)
        append_items()
        init_attr()
        return el

        function init_attr () {
            // define conditions
            if (state) set_attr({aria: 'aria-live', prop: 'assertive'})
            if (role === 'tab') {
                set_attr({aria: 'selected', prop: is_selected})
                set_attr({aria: 'controls', prop: controls})
                el.setAttribute('tabindex', is_current ? 0 : -1)
            }
            if (role === 'switch') {
                set_attr({aria: 'checked', prop: is_checked})
            }
            if (role === 'listbox') set_attr({aria: 'haspopup', prop: role})
            if (disabled) {
                set_attr({aria: 'disabled', prop: is_disabled})
                el.setAttribute('disabled', is_disabled)
            } 
            if (is_checked) set_attr({aria: 'checked', prop: is_checked})
            if (role.match(/option/)) {
                is_selected = is_current ? is_current : is_selected
                set_attr({aria: 'selected', prop: is_selected})
            }
            if (expanded !== undefined) {
                set_attr({aria: 'expanded', prop: is_expanded})
            }
            // make current status
            if (current !== undefined) set_attr({aria: 'current', prop: is_current})
        }

        function set_attr ({aria, prop}) {
            el.setAttribute(`aria-${aria}`, prop)
        }

        // make element to append into shadowDOM
        function append_items() {           
            const items = [make_icon, add_cover, add_text]
            const target = role === 'listbox' ? listbox : role === 'option' ?  option : shadow
            // list of listbox or dropdown menu
            if (role.match(/option/)) shadow.append(make_list_icon, option)
            // listbox or dropdown button
            if (role.match(/listbox/)) shadow.append(make_select_icon, listbox)
            items.forEach( item => {
                if (item === undefined) return
                target.append(item)
            })
        }

        // toggle
        function switched_event (data) {
            const {checked} = data
            is_checked = checked
            if (is_checked) return set_attr({aria: 'checked', prop: is_checked})
            else el.removeAttribute('aria-checked')
        }
        function expanded_event (data) {
            is_expanded = data
            set_attr({aria: 'expanded', prop: is_expanded})
        }
        function collapsed_event (data) {
            is_expanded = data
            set_attr({aria: 'expanded', prop: is_expanded})
        }
        // tab selected
        function tab_selected_event ({selected}) {
            is_selected = selected
            set_attr({aria: 'selected', prop: is_selected})
            el.setAttribute('tabindex', is_current ? 0 : -1)
        }
        function list_selected_event (state) {
            is_selected = state
            set_attr({aria: 'selected', prop: is_selected})
            if (mode === 'single-select') {
                is_current = is_selected
                set_attr({aria: 'current', prop: is_current})
            }
            // option is selected then send selected items to listbox button
            if (is_selected) send(make({to: 'listbox', type: 'changed', data: {text: body, cover, icon} }))
        }
        function changed_event (data) {
            const {text, cover, icon, title} = data
            // new element
            const new_text = make_element({name: 'span', classlist: 'text'})
            const new_avatar = make_element({name: 'span', classlist: 'avatar'})
            // old element
            const old_icon = shadow.querySelector('.icon')
            const old_avatar = shadow.querySelector('.avatar')
            const old_text = shadow.querySelector('.text')
            // change content for button or switch or tab
            if (role.match(/button|switch|tab/)) {
                el.setAttribute('aria-label', text || title)
                if (text) {
                    if (old_text) old_text.textContent = text
                } else {
                    if (old_text) old_text.remove()
                }
                if (cover) {
                    if (old_avatar) {
                        const img = old_avatar.querySelector('img')
                        img.alt = text || title
                        img.src = cover
                    } else {
                        new_avatar.append(make_img({src: cover, alt: text || title}))
                        shadow.insertBefore(new_avatar, shadow.firstChild)
                    }
                } else {
                    if (old_avatar) old_avatar.remove()
                }
                if (icon) {
                    const new_icon = main_icon(icon)
                    if (old_icon) old_icon.parentNode.replaceChild(new_icon, old_icon)
                    else shadow.insertBefore(new_icon, shadow.firstChild)
                } else {
                    if (old_icon) old_icon.remove()
                }
            }
            // change content for listbox
            if (role.match(/listbox/)) {
                listbox.innerHTML = ''
                if (icon) {
                    const new_icon = main_icon(icon)
                    if (role.match(/listbox/)) listbox.append(new_icon)
                }
                if (cover) {
                    new_avatar.append(make_img({src: cover, alt: text}))
                    if (role.match(/listbox/)) listbox.append(new_avatar)
                }
                if (text) {
                    new_text.append(text)
                    if (role.match(/listbox/)) listbox.append(new_text)
                }
            } 
        }
        // button click
        function handle_click () {
            const type = 'click'
            if ('current' in opt) {
                send( make({to: controls, type: 'current', data: {name, current: is_current}}) )
            }
            if (expanded !== undefined) {
                const type = !is_expanded ? 'expanded' : 'collapsed'
                send( make({type, data: {name, expanded: is_expanded}}))
            }
            if (role === 'button') {
                return send( make({type, to: controls} ))
            }
            if (role === 'tab') {
                if (is_current) return
                is_selected = !is_selected
                return send( make({to: controls, type, data: {name, selected: is_selected}}) )
            }
            if (role === 'switch') {
                return send( make({to: controls, type, data: {name, checked: is_checked}}) )
            }
            if (role === 'listbox') {
                is_expanded = !is_expanded
                return send( make({type, data: {name, expanded: is_expanded}}))
            }
            if (role === 'option') {
                is_selected = !is_selected
                return send( make({to: controls, type, data: {name, selected: is_selected, content: is_selected ? {text: body, cover, icon} : '' }}) )
            }
        }
        // protocol get msg
        function get (msg) {
            const { head, refs, type, data } = msg
            // toggle
            if (type.match(/switched/)) return switched_event(data)
            // dropdown
            if (type.match(/expanded/)) return expanded_event(data)
            if (type.match(/collapsed/)) return collapsed_event(data)
            // tab, checkbox
            if (type.match(/tab-selected/)) return tab_selected_event(data)
            // option
            if (type.match(/selected|unselected/)) return list_selected_event(data)
            if (type.match(/changed/)) return changed_event(data)
            if (type.match(/current/)) {
                is_current = data
                return set_attr({aria: 'current', prop: is_current})
            }
        }
    }
   
    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    const {props = {}, grid = {}} = theme
    const {
        // default -----------------------------------------//
        padding, margin, width, height, opacity, 
        // size
        size, size_hover, 
        // weight
        weight, weight_hover, 
        // color
        color, color_hover, color_focus,
        // background-color
        bg_color, bg_color_hover, bg_color_focus,
        // border
        border_color, border_color_hover,
        border_width, border_style, border_opacity, border_radius, 
        // icon
        icon_fill, icon_fill_hover, icon_size, icon_size_hover,
        // avatar
        avatar_width, avatar_height, avatar_radius,
        avatar_width_hover, avatar_height_hover,
        // shadow
        shadow_color, shadow_color_hover, 
        offset_x, offset_x_hover,
        offset_y, offset_y_hover, 
        blur, blur_hover,
        shadow_opacity, shadow_opacity_hover,
        // scale
        scale, scale_hover,
        // current -----------------------------------------//
        current_size, 
        current_weight, 
        current_color, 
        current_bg_color,
        current_icon_size,
        current_icon_fill,
        current_list_selected_icon_size,
        current_list_selected_icon_fill,
        current_avatar_width, 
        current_avatar_height,
        // disabled -----------------------------------------//
        disabled_size, disabled_weight, disabled_color,
        disabled_bg_color, disabled_icon_fill, disabled_icon_size,
        // role === option ----------------------------------//
        list_selected_icon_size, list_selected_icon_size_hover,
        list_selected_icon_fill, list_selected_icon_fill_hover,
        // role === listbox ----------------------------------//
        // collapsed settings
        listbox_collapsed_bg_color, listbox_collapsed_bg_color_hover,
        listbox_collapsed_icon_size, listbox_collapsed_icon_size_hover,
        listbox_collapsed_icon_fill, listbox_collapsed_icon_fill_hover, 
        listbox_collapsed_listbox_color, listbox_collapsed_listbox_color_hover,
        listbox_collapsed_listbox_size, listbox_collapsed_listbox_size_hover,
        listbox_collapsed_listbox_weight, listbox_collapsed_listbox_weight_hover,
        listbox_collapsed_listbox_icon_size, listbox_collapsed_listbox_icon_size_hover,
        listbox_collapsed_listbox_icon_fill, listbox_collapsed_listbox_icon_fill_hover,
        listbox_collapsed_listbox_avatar_width, listbox_collapsed_listbox_avatar_height,
        // expanded settings
        listbox_expanded_bg_color,
        listbox_expanded_icon_size, 
        listbox_expanded_icon_fill,
        listbox_expanded_listbox_color,
        listbox_expanded_listbox_size, 
        listbox_expanded_listbox_weight,
        listbox_expanded_listbox_avatar_width, 
        listbox_expanded_listbox_avatar_height,
        listbox_expanded_listbox_icon_size, 
        listbox_expanded_listbox_icon_fill, 
    } = props

    const grid_init = {auto: {auto_flow: 'column'}, align: 'items-center', gap: '5px', justify: 'items-center'}
    const grid_option = grid.option ? grid.option : grid_init
    const grid_listbox = grid.listbox ? grid.listbox : grid_init
    const style = `
    :host(i-button) {
        --size: ${size ? size : 'var(--primary-size)'};
        --weight: ${weight ? weight : 'var(--weight300)'};
        --color: ${color ? color : 'var(--primary-color)'};
        --color-focus: ${color_focus ? color_focus : 'var(--primary-color-focus)'};
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
        --bg-color-focus: ${bg_color_focus ? bg_color_focus : 'var(--primary-bg-color-focus)'};
        ${width && `--width: ${width}`};
        ${height && `--height: ${height}`};
        --opacity: ${opacity ? opacity : '1'};
        --padding: ${padding ? padding : '12px'};
        --margin: ${margin ? margin : '0'};
        --border-width: ${border_width ? border_width : '0px'};
        --border-style: ${border_style ? border_style : 'solid'};
        --border-color: ${border_color ? border_color : 'var(--primary-color)'};
        --border-opacity: ${border_opacity ? border_opacity : '1'};
        --border: var(--border-width) var(--border-style) hsla( var(--border-color), var(--border-opacity) );
        --border-radius: ${border_radius ? border_radius : 'var(--primary-radius)'};
        --offset_x: ${offset_x ? offset_x : '0px'};
        --offset-y: ${offset_y ? offset_y : '6px'};
        --blur: ${blur ? blur : '30px'};
        --shadow-color: ${shadow_color ? shadow_color : 'var(--primary-color)'};
        --shadow-opacity: ${shadow_opacity ? shadow_opacity : '0'};
        --box-shadow: var(--offset_x) var(--offset-y) var(--blur) hsla( var(--shadow-color), var(--shadow-opacity) );
        --avatar-width: ${avatar_width ? avatar_width : 'var(--primary-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--primary-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--primary-avatar-radius)'};
        display: inline-grid;
        ${grid.button ? make_grid(grid.button) : make_grid({auto: {auto_flow: 'column'}, gap: '5px', justify: 'content-center', align: 'items-center'})}
        ${width && 'width: var(--width);'};
        ${height && 'height: var(--height);'};
        max-width: 100%;
        font-size: var(--size);
        font-weight: var(--weight);
        color: hsl( var(--color) );
        background-color: hsla( var(--bg-color), var(--opacity) );
        border: var(--border);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        padding: var(--padding);
        transition: font-size .3s, font-weight .15s, color .3s, background-color .3s, opacity .3s, border .3s, box-shadow .3s ease-in-out;
        cursor: pointer;
        -webkit-mask-image: -webkit-radial-gradient(white, black);
    }
    :host(i-button:hover) {
        --size: ${size_hover ? size_hover : 'var(--primary-size-hover)'};
        --weight: ${weight_hover ? weight_hover : 'var(--primary-weight-hover)'};
        --color: ${color_hover ? color_hover : 'var(--primary-color-hover)'};
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--primary-bg-color-hover)'};
        --border-color: ${border_color_hover ? border_color_hover : 'var(--primary-color-hover)'};
        --offset-x: ${offset_x_hover ? offset_x_hover : '0'};
        --offset-y: ${offset_y_hover ? offset_y_hover : '0'};
        --blur: ${blur_hover ? blur_hover : '50px'};
        --shadow-color: ${shadow_color_hover ? shadow_color_hover : 'var(--primary-color-hover)'};
        --shadow-opacity: ${shadow_opacity_hover ? shadow_opacity_hover : '0'};
    }
    :host(i-button:hover:foucs:active) {
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
    }
    :host(i-button:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
        background-color: hsla(var(--bg-color));
    }  
    :host(i-button) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--primary-icon-fill)'};
        fill: hsl(var(--icon-fill));
        transition: fill 0.05s ease-in-out;
    }
    :host(i-button:hover) g {
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--primary-icon-fill-hover)'};
    }
    :host(i-button) .avatar {
        display: block;
        width: var(--avatar-width);
        height: var(--avatar-height);
        max-width: 100%;
        border-radius: var(--avatar-radius);
        -webkit-mask-image: -webkit-radial-gradient(white, black);
        overflow: hidden;
        transition: width .3s, height .3s ease-in-out;
        ${make_grid(grid.avatar)}
    }
    :host(i-button) img {
        --scale: ${scale ? scale : '1'};
        width: 100%;
        height: 100%;
        transform: scale(var(--scale));
        transition: transform 0.3s, scale 0.3s linear;
        object-fit: cover;
        border-radius: var(--avatar-radius);
    }
    :host(i-button:hover) img {
        --scale: ${scale_hover ? scale_hover : '1.2'};
        transform: scale(var(--scale));
    }
    :host(i-button) svg {
        width: 100%;
        height: auto;
    }
    :host(i-button[aria-expanded="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    } 
    :host(i-button[role="tab"]) {
        --width: ${width ? width : '100%'};
        --border-radius: ${border_radius ? border_radius : '0'};
    }
    :host(i-button[role="switch"]) {
        --size: ${size ? size : 'var(--primary-size)'};
    }
    :host(i-button[role="switch"]:hover) {
        --size: ${size_hover ? size_hover : 'var(--primary-size-hover)'};
    }
    :host(i-button[role="switch"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="listbox"]) {
        --color: ${listbox_collapsed_listbox_color ? listbox_collapsed_listbox_color : 'var(--listbox-collapsed-listbox-color)'};
        --size: ${listbox_collapsed_listbox_size ? listbox_collapsed_listbox_size : 'var(--listbox-collapsed-listbox-size)'};
        --weight: ${listbox_collapsed_listbox_weight ? listbox_collapsed_listbox_weight : 'var(--listbox-collapsed-listbox-weight)'};
        --bg-color: ${listbox_collapsed_bg_color ? listbox_collapsed_bg_color : 'var(--listbox-collapsed-bg-color)'};
    }
    :host(i-button[role="listbox"]:hover) {
        --color: ${listbox_collapsed_listbox_color_hover ? listbox_collapsed_listbox_color_hover : 'var(--listbox-collapsed-listbox-color-hover)'};
        --size: ${listbox_collapsed_listbox_size_hover ? listbox_collapsed_listbox_size_hover : 'var(--listbox-collapsed-listbox-size-hover)'};
        --weight: ${listbox_collapsed_listbox_weight_hover ? listbox_collapsed_listbox_weight_hover : 'var(--listbox-collapsed-listbox-weight-hover)'};
        --bg-color: ${listbox_collapsed_bg_color_hover ? listbox_collapsed_bg_color_hover : 'var(--listbox-collapsed-bg-color-hover)'};
    }
    :host(i-button[role="listbox"]:focus), :host(i-button[role="listbox"][aria-expanded="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="listbox"]) > .icon {
        ${grid.icon ? make_grid(grid.icon) : make_grid({column: '2'})}
    }
    :host(i-button[role="listbox"]) .text {}
    :host(i-button[role="listbox"]) .avatar {
        --avatar-width: ${listbox_collapsed_listbox_avatar_width ? listbox_collapsed_listbox_avatar_width : 'var(--listbox-collapsed-listbox-avatar-width)'};
        --avatar-height: ${listbox_collapsed_listbox_avatar_height ? listbox_collapsed_listbox_avatar_height : 'var(--listbox-collapsed-listbox-avatar-height)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]),
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) {
        --size: ${listbox_expanded_listbox_size ? listbox_expanded_listbox_size : 'var(--listbox-expanded-listbox-size)'};
        --color: ${listbox_expanded_listbox_color ? listbox_expanded_listbox_color : 'var(--listbox-expanded-listbox-color)'};
        --weight: ${listbox_expanded_listbox_weight ? listbox_expanded_listbox_weight : 'var(--listbox-expanded-listbox-weight)'};
        --bg-color: ${listbox_expanded_bg_color ? listbox_expanded_bg_color : 'var(--listbox-expanded-bg-color)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .avatar {
        --avatar-width: ${listbox_expanded_listbox_avatar_width ? listbox_expanded_listbox_avatar_width : 'var(--listbox-expanded-listbox-avatar-width)'};
        --avatar-height: ${listbox_expanded_listbox_avatar_height ? listbox_expanded_listbox_avatar_height : 'var(--listbox-expanded-listbox-avatar-height)'};
    }
    :host(i-button[role="option"]) {
        --border-radius: ${border_radius ? border_radius : '0'};
        --opacity: ${opacity ? opacity : '0'};
    }
    :host(i-button[role="option"][aria-current="true"]), :host(i-button[role="option"][aria-current="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-list-size)'};
        --color: ${current_color ? current_color : 'var(--current-list-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-list-bg-color)'};
        --opacity: ${opacity ? opacity : '0'}
    }
    :host(i-button[role="option"][aria-current="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="option"][disabled]), :host(i-button[role="option"][disabled]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--primary-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--primary-disabled-color)'};
        --bg-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        --opacity: ${opacity ? opacity : '0'}
    }
    :host(i-button[aria-disabled="true"]) .icon, 
    :host(i-button[aria-disabled="true"]:hover) .icon,
    :host(i-button[role="option"][aria-disabled="true"]) .icon, 
    :host(i-button[role="option"][aria-disabled="true"]:hover) .icon,
    :host(i-button[role="listbox"][aria-disabled="true"]) .icon, 
    :host(i-button[role="listbox"][aria-disabled="true"]:hover) .icon {
        --icon-size: ${disabled_icon_size ? disabled_icon_size : 'var(--primary-disabled-icon-size)'};
    }
    :host(i-button[disabled]:hover) img {
        transform: scale(1);
    }
    :host(i-button[aria-current="true"]), :host(i-button[aria-current="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-size)'};
        --weight: ${current_weight ? current_weight : 'var(--current-weight)'};
        --color: ${current_color ? current_color : 'var(--current-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    :host(i-button[aria-current="true"]) .icon,  :host(i-button[aria-current="true"]:hover) .icon {
        --icon-size: ${current_icon_size ? current_icon_size : 'var(--current-icon-size)'};
    }
    :host(i-button[aria-current="true"]) g {
        --icon-fill: ${current_icon_fill ? current_icon_fill : 'var(--current-icon-fill)'};
    }
    :host(i-button[aria-current="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]) .option > .icon, 
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]:hover) .option > .icon {
        --icon-size: ${current_icon_size ? current_icon_size : 'var(--current-icon-size)'};
    }
    :host(i-button[aria-checked="true"]), :host(i-button[aria-expanded="true"]),
    :host(i-button[aria-checked="true"]:hover), :host(i-button[aria-expanded="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-size)'};
        --weight: ${current_weight ? current_weight : 'var(--current-weight)'};
        --color: ${current_color ? current_color : 'var(--current-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    /*
    :host(i-button[role="switch"][aria-expanded="true"]) g {
        --icon-fill: var(--current-icon-fill);
    }*/
    /* listbox collapsed */
    :host(i-button[role="listbox"]) > .icon {
        --icon-size: ${listbox_collapsed_icon_size ? listbox_collapsed_icon_size : 'var(--listbox-collapsed-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon {
        --icon-size: ${listbox_collapsed_icon_size_hover ? listbox_collapsed_icon_size_hover : 'var(--listbox-collapsed-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon {
        --icon-size: ${listbox_collapsed_listbox_icon_size ? listbox_collapsed_listbox_icon_size : 'var(--listbox-collapsed-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon {
        --icon-size: ${listbox_collapsed_listbox_icon_size_hover ? listbox_collapsed_listbox_icon_size_hover : 'var(--listbox-collapsed-listbox-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) > .icon g {
        --icon-fill: ${listbox_collapsed_icon_fill ? listbox_collapsed_icon_fill : 'var(--listbox-collapsed-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon g {
        --icon-fill: ${listbox_collapsed_icon_fill_hover ? listbox_collapsed_icon_fill_hover : 'var(--listbox-collapsed-icon-fill-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon g {
        --icon-fill: ${listbox_collapsed_listbox_icon_fill ? listbox_collapsed_listbox_icon_fill : 'var(--listbox-collaps-listbox-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_collapsed_listbox_icon_fill_hover ? listbox_collapsed_listbox_icon_fill_hover : 'var(--listbox-collapsed-listbox-icon-fill-hover)'};
    }
    /* listbox expanded */
    :host(i-button[role="listbox"][aria-expanded="true"]) > .icon,
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) > .icon {
        --icon-size: ${listbox_expanded_icon_size ? listbox_expanded_icon_size : 'var(--listbox-expanded-icon-size)'};
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) > .icon g, 
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) > .icon g {
        --icon-fill: ${listbox_expanded_icon_fill ? listbox_expanded_icon_fill : 'var(--listbox-expanded-icon-fill)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .listbox > .icon, 
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) .listbox > .icon {
        --icon-fill: ${listbox_expanded_listbox_icon_size ? listbox_expanded_listbox_icon_size : 'var(--listbox-expanded-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .listbox > .icon g,
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_expanded_listbox_icon_fill ? listbox_expanded_listbox_icon_fill : 'var(--listbox-expanded-listbox-icon-fill)'};
    }
    :host(i-button[aria-checked="true"]) > .icon g {
        --icon-fill: ${current_icon_fill ? current_icon_fill : 'var(--color-white)' };
    }
    :host(i-button[disabled]), :host(i-button[disabled]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--primary-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--primary-disabled-color)'};
        --bg-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        cursor: not-allowed;
    }
    :host(i-button[disabled]) g, 
    :host(i-button[disabled]:hover) g, 
    :host(i-button[role="option"][disabled]) > .icon g, 
    :host(i-button[role="option"][disabled]) .option > .icon g,
    :host(i-button[role="listbox"][disabled]) .option > .icon g, 
    :host(i-button[role="option"][disabled]:hover) > .icon g,
    :host(i-button[role="listbox"][disabled]:hover) .option > .icon g, 
    :host(i-button[role="option"][disabled]:hover) .option > .icon g {
        --icon-fill: ${disabled_color ? disabled_color : 'var(--primary-disabled-icon-fill)'};
    }
    :host(i-button[role="menuitem"]) {
        --size: ${size ? size : 'var(--menu-size)'};
        --weight: ${weight ? weight : 'var(--menu-weight)'};
        --color: ${color ? color : 'var(--menu-color)'};
        --border-radius: 0;
        background-color: transparent;
    }
    :host(i-button[role="menuitem"]:hover) {
        --size: ${size_hover ? size_hover : 'var(--menu-size-hover)'};
        --weight: ${weight_hover ? weight_hover : 'var(--menu-weight-hover)'};
        --color: ${color_hover ? color_hover : 'var(--menu-color-hover)'};
    }
    :host(i-button[role="menuitem"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="menuitem"]) .avatar {
        --avatar-width: ${avatar_width ? avatar_width : 'var(--menu-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--menu-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--menu-avatar-radius)'};
    }
    :host(i-button[role="menuitem"]:hover) .avatar {
        --avatar-width: ${avatar_width_hover ? avatar_width_hover : 'var(--menu-avatar-width-hover)'};
        --avatar-height: ${avatar_height_hover ? avatar_height_hover : 'var(--menu-avatar-height-hover)'};
    }
    :host(i-button[role="menuitem"][disabled]), :host(i-button[role="menuitem"][disabled]):hover {
        --size: ${disabled_size ? disabled_size : 'var(--menu-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--menu-disabled-color)'};
        --weight: ${disabled_weight ? disabled_weight : 'var(--menu-disabled-weight)'};
    }
    :host(i-button[role="menuitem"][disabled]) g ,
    :host(i-button[role="menuitem"][disabled]:hover) g {
        --icon-fill: ${disabled_icon_fill ? disabled_icon_fill : 'var(--primary-disabled-icon-fill)'};
    }
    :host(i-button[role="option"]) > .icon {
        --icon-size: ${list_selected_icon_size ? list_selected_icon_size : 'var(--list-selected-icon-size)'};
    }
    :host(i-button[role="option"]:hover) > .icon {
        --icon-size: ${list_selected_icon_size_hover ? list_selected_icon_size_hover : 'var(--list-selected-icon-size-hover)'};
    }
    :host(i-button[role="option"]) > .icon g {
        --icon-fill: ${list_selected_icon_fill ? list_selected_icon_fill : 'var(--list-selected-icon-fill)'};
    }
    :host(i-button[role="option"]:hover) > .icon g {
        --icon-fill: ${list_selected_icon_fill_hover ? list_selected_icon_fill_hover : 'var(--list-selected-icon-fill-hover)'};
    }
    :host(i-button[role="option"][aria-current="true"]) > .icon, 
    :host(i-button[role="option"][aria-current="true"]:hover) > .icon {
        --icon-size: ${current_list_selected_icon_size ? current_list_selected_icon_size : 'var(--current-list-selected-icon-size)'};
    }
    :host(i-button[role="option"][aria-current="true"]) > .icon g, 
    :host(i-button[role="option"][aria-current="true"]:hover) > .icon g { 
        --icon-fill: ${current_list_selected_icon_fill ? current_list_selected_icon_fill : 'var(--current-list-selected-icon-fill)'};
    }
    :host(i-button[role="option"][aria-selected="false"]) > .icon {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    :host(i-button[role="option"][aria-selected="true"]) > .icon {
        opacity: 1;
    }
    /* define grid */
    :host(i-button) .text {
        ${make_grid(grid.text)}
    }
    :host(i-button) .icon {
        --icon-size: ${icon_size ? icon_size : 'var(--primary-icon-size)'};
        display: block;
        width: var(--icon-size);
        transition: width 0.25s ease-in-out;
        ${make_grid(grid.icon)}
    }
    :host(i-button:hover) .icon {
        --icon-size: ${icon_size_hover ? icon_size_hover : 'var(--primary-icon-size-hover)'};
    }
    :host(i-button) .listbox {
        display: grid;
        max-width: 100%;
        ${make_grid(grid_listbox)}
    }
    :host(i-button) .option {
        display: grid;
        max-width: 100%;
        ${make_grid(grid_option)}
    }
    :host(i-button) .option > .icon {
        ${make_grid(grid.option_icon)}
    }
    :host(i-button) .option > .avatar {
        ${make_grid(grid.option_avatar)}
    }
    :host(i-button) .option > .text {
        ${make_grid(grid.option_text)}
    }
    ${custom_style}
    `

    return widget()
}
},{"make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-grid.js","make-icon":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-icon.js","make-image":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-image.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-element.js":[function(require,module,exports){
module.exports = make_element

function make_element({name = '', classlist = null, role }) {
    const el = document.createElement(name)
    if (classlist) ste_class()
    if (role) set_role()
    return el

    function ste_class () {
        el.className = classlist
    }
    
    function set_role () {
        const tabindex = role.match(/button|switch/) ? 0 : -1
        el.setAttribute('role', role)
        el.setAttribute('tabindex',  tabindex)
    }
}


},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-grid.js":[function(require,module,exports){
module.exports = make_grid

function make_grid (opts = {}) {
    const {areas, area, rows, columns, row, auto = {}, column, gap, justify, align} = opts
    let style = ''
    grid_init ()
    return style

    function grid_init () {
        make_rows()
        make_columns()
        make_auto()
        make_row()
        make_column()
        make_justify()
        make_align()
        make_gap()
        make_area()
        make_areas()
    }
     
    function make_areas () {
        if (typeof areas === 'object') {
            let template = `grid-template-areas:`
            areas.map( a => template += `"${a}"`)
            return style += template + ';'
        }
        if (typeof areas === 'string') return areas ? style +=`grid-template-areas: "${areas}";` : ''
    }
    function make_area () {
        return area ? style += `grid-area: ${area};` : ''
    }

    function make_rows () { 
        return rows ? style +=  `grid-template-rows: ${rows};` : ''
    }

    function make_columns () {
        return columns ? style += `grid-template-columns: ${columns};` : ''
    }

    function make_row () {
        return row ? style += `grid-row: ${row};` : ''
    }

    function make_column () {
        return column ? style += `grid-column: ${column};` : ''
    }

    function make_justify () {
        if (justify === void 0) return
        const result = justify.split('-')
        const [type, method] = result
        return style += `justify-${type}: ${method};`
    }

    function make_align () {
        if (align === void 0) return
        const result = align.split('-')
        const [type, method] = result
        return style += `align-${type}: ${method};`
    }

    function make_gap () {
        if (gap === void 0) return ''
        return style += `gap: ${gap};`
    }

    function make_auto () {
        const {auto_flow = null, auto_rows = null, auto_columns = null} = auto
        const grid_auto_flow = auto_flow ? `grid-auto-flow: ${auto_flow};` : ''
        const grid_auto_rows = auto_rows ? `grid-auto-rows: ${auto_rows};` : ''
        const grid_auto_columns = auto_columns ? `grid-auto-columns: ${auto_columns};` : ''
        return style += `${grid_auto_flow}${grid_auto_rows}${grid_auto_columns}`
    }
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-icon.js":[function(require,module,exports){
const i_icon = require('datdot-ui-icon')

module.exports = {main_icon, select_icon, list_icon}

function main_icon ({name, path}) {
    const el = i_icon({name, path})
    return el
}

function select_icon ({name = 'arrow-down', path}) {
    const el =  i_icon({name, path})
    return el
}

function list_icon ({name = 'check', path} ) {
    const el =  i_icon({name, path})
    return el
}


},{"datdot-ui-icon":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-icon/src/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-image.js":[function(require,module,exports){
module.exports = img

function img ({src, alt}) {
    const img = document.createElement('img')
    img.setAttribute('src', src)
    img.setAttribute('alt', alt)
    return img
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/message-maker.js":[function(require,module,exports){
module.exports = function message_maker (from) {
    let msg_id = 0
    return function make ({to, type, data = null, refs = []}) {
        const stack = (new Error().stack.split('\n').slice(2).filter(x => x.trim()))
        const message = { head: [from, to, ++msg_id], refs, type, data, meta: { stack }}
        return message
    }
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/support-style-sheet.js":[function(require,module,exports){
module.exports = support_style_sheet
function support_style_sheet (root, style) {
    return (() => {
        try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(style)
            root.adoptedStyleSheets = [sheet]
            return true 
        } catch (error) { 
            const inject_style = `<style>${style}</style>`
            root.innerHTML = `${inject_style}`
            return false
        }
    })()
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-icon/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const svg = require('svg')

module.exports = ({name, path, is_shadow = false, theme}) => {
    const url = path ? path : './src/svg'
    const symbol = svg(`${url}/${name}.svg`)
    if (is_shadow) {
        function layout (style) {
            const icon = document.createElement('i-icon')
            const shadow = icon.attachShadow({mode: 'closed'})
            const slot = document.createElement('slot')
            slot.name = 'icon'
            style_sheet(shadow, style)
            slot.append(symbol)
            shadow.append(slot)
            return icon
        }
        // insert CSS style
        const custom_style = theme ? theme.style : ''
        // set CSS variables
        if (theme && theme.props) {
            var { fill, size } = theme.props
        }
        const style = `
        :host(i-icon) {
            --size: ${size ? size : '24px'};
            --fill: ${fill ? fill : 'var(--primary-color)'};
            display: block;
        }
        slot[name='icon'] {
            display: grid;
            justify-content: center;
            align-items: center;
        }
        slot[name='icon'] span {
            display: block;
            width: var(--size);
            height: var(--size);
        }
        slot[name='icon'] svg {
            width: 100%;
            height: auto;
        }
        slot[name='icon'] g {
            fill: hsl(var(--fill));
            transition: fill .3s ease-in-out;
        }
        ${custom_style}
        `
        return layout(style)
    }

    return symbol
}

},{"support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-icon/src/node_modules/support-style-sheet.js","svg":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-icon/src/node_modules/svg.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-icon/src/node_modules/support-style-sheet.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/support-style-sheet.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-icon/src/node_modules/svg.js":[function(require,module,exports){
module.exports = svg
function svg (path) {
    const span = document.createElement('span')
    span.classList.add('icon')
    get_svg()
    async function get_svg () {
        const res = await fetch(path)
        if (res.status !== 200) throw new Error(res.status)
        let data = await res.text()
        span.innerHTML = data
    }
    return span
}   
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const {i_button, i_link} = require('datdot-ui-button')
const button = i_button
const message_maker = require('message-maker')
const make_grid = require('make-grid')
module.exports = i_list

function i_list (opts = {}, protocol) {
    const {page = '*', flow = 'ui-list', name, body = [], mode = 'multiple-select', expanded = false, hidden = true, theme = {} } = opts
    const recipients = []
    const make = message_maker(`${name} / ${flow} / i_list`)
    const message = make({type: 'ready'})
    let is_hidden = hidden
    let is_expanded = !is_hidden ? !is_hidden : expanded
    const store_selected = []
    const {grid} = theme

    function widget () {
        const send = protocol( get )
        send(message)
        const list = document.createElement('i-list')
        const shadow = list.attachShadow({mode: 'closed'})
        list.ariaHidden = is_hidden
        list.ariaLabel = name
        list.tabIndex = -1
        list.ariaExpanded = is_expanded
        list.dataset.mode = mode
        style_sheet(shadow, style)
        try {
            if (mode.match(/single|multiple/)) {
                list.setAttribute('role', 'listbox')
                make_selector(body)
            }   
            if (mode.match(/dropdown/)) {
                list.setAttribute('role', 'menubar')
                make_list()
            }
            if (body.length === 0) send(make({type: 'error', data: 'body no items'}))
        } catch(e) {
            send(make({type: 'error', data: {message: 'something went wrong', opts }}))
        }
        
        return list

        function make_selector (args) {
            args.forEach( (list, i) => {
                const {list_name, address = undefined, text = undefined, role = 'option', icons = {}, cover, current = undefined, selected = false, disabled = false, theme = {}} = list
                const {style = ``, props = {}} = theme
                const {
                    size = 'var(--primary-size)', 
                    size_hover = 'var(--primary-size)',
                    weight = '300', 
                    color = 'var(--primary-color)', 
                    color_hover = 'var(--primary-color-hover)', 
                    color_focus = 'var(--color-white)',
                    bg_color = 'var(--primary-bg-color)', 
                    bg_color_hover = 'var(--primary-bg-color-hover)', 
                    bg_color_focus = 'var(--primary-bg-color-focus)',
                    icon_size = 'var(--primary-icon-size)',
                    icon_size_hover = 'var(--primary-icon-size_hover)',
                    icon_fill = 'var(--primary-icon-fill)',
                    icon_fill_hover = 'var(--primary-icon-fill-hover)',
                    avatar_width = 'var(--primary-avatar-width)', 
                    avatar_height = 'var(--primary-avatar-height)', 
                    avatar_radius = 'var(--primary-avatar-radius)',
                    current_size = 'var(--current-list-size)',
                    current_color = 'var(--current-list-color)',
                    current_weight = 'var(--current-list-weight)',
                    current_icon_size = 'var(--current-icon-size)',
                    current_icon_fill = 'var(--current-icon-fill)',
                    current_list_selected_icon_size = 'var(--current-list-selected-icon-size)',
                    current_list_selected_icon_fill = 'var(--current-list-selected-icon-fill)',
                    list_selected_icon_size = 'var(--list-selected-icon-size)',
                    list_selected_icon_fill = 'var(--list-selected-icon-fill)',
                    list_selected_icon_fill_hover = 'var(--list-selected-icon-fill-hover)',
                    disabled_color = 'var(--primary-disabled-color)',
                    disabled_bg_color = 'var(--primary-disabled-bg-color)',
                    disabled_icon_fill = 'var(--primary-disabled-fill)',
                    padding = '',
                    opacity = '0'
                } = props

                const is_current = mode === 'single-select' ? current : false
                const make_button = button({
                    page,
                    name: list_name, 
                    body: text, 
                    role, icons, cover, 
                    current: is_current, 
                    selected, 
                    disabled,
                    theme: {
                        style,
                        props: {
                        size, size_hover, weight, 
                        color, color_hover, color_focus,
                        bg_color, bg_color_hover, bg_color_focus,
                        icon_size, icon_size_hover, icon_fill, icon_fill_hover,
                        avatar_width, avatar_height, avatar_radius,
                        current_size, current_color, current_weight,
                        current_icon_size, current_icon_fill,
                        current_list_selected_icon_size, current_list_selected_icon_fill,
                        list_selected_icon_size, list_selected_icon_fill, list_selected_icon_fill_hover,
                        disabled_color, disabled_bg_color, disabled_icon_fill,
                        padding,
                        opacity
                    }, 
                    grid
                }}, button_protocol(list_name))

                const li = document.createElement('li')
                if (address) li.dataset.address = address
                li.dataset.option = text || list_name
                li.setAttribute('aria-selected', is_current || selected)
                if (is_current) li.setAttribute('aria-current', is_current)
                if (disabled) li.setAttribute('disabled', disabled)
                const make = message_maker(`${list_name} / option / ${flow} / widget`)
                li.append(make_button)
                shadow.append(li)
                send( make({type: 'ready'}) )
            })
        }

        function make_list () {
            body.map( (list, i) => {
                const {list_name, text = undefined, role = 'option', url = '#', target, icons, cover, disabled = false, theme = {}} = list
                const {style = ``, props = {}} = theme
                const {
                    size = `var(--primary-size)`, 
                    size_hover = `var(--primary-size)`, 
                    color = `var(--primary-color)`, 
                    color_hover = `var(--primary-color-hover)`,     
                    bg_color = 'var(--primary-bg-color)', 
                    bg_color_hover = 'var(--primary-bg-color-hover)', 
                    icon_fill = 'var(--primary-color)', 
                    icon_fill_hover = 'var(--primary-color-hover)', 
                    icon_size = 'var(--primary-icon-size)',
                    icon_size_hover = 'var(--primary-icon-size-hover)',
                    current_icon_size = 'var(--current-icon-size)',
                    avatar_width = 'var(--primary-avatar-width)', 
                    avatar_height = 'var(--primary-avatar-height)', 
                    avatar_radius = 'var(--primary-avatar-radius)',
                    disabled_color = 'var(--primary-disabled-color)',
                    disabled_bg_color = 'var(--primary-disabled-bg-color)',
                    disabled_icon_fill = 'var(--primary-disabled-icon-fill)',
                    padding = null
                } = props
                if (role === 'link' ) {
                    var item = i_link({
                        page,
                        name: list_name,
                        body: text,
                        role: 'menuitem',
                        link: {
                            url,
                            target
                        },
                        icons,
                        cover,
                        disabled,
                        theme: {
                            style,
                            props,
                            grid
                        }
                    }, button_protocol(list_name))
                }

                if (role === 'menuitem') {
                    var item = i_button({
                        name: list_name,
                        body: text,
                        role,
                        icons,
                        cover,
                        disabled,
                        theme: {
                            style,
                            props: {
                                size, size_hover,
                                color, color_hover,
                                bg_color, bg_color_hover,
                                icon_fill, icon_fill_hover,
                                icon_size, icon_size_hover,
                                current_icon_size,
                                avatar_width, avatar_height, avatar_radius,
                                disabled_color, disabled_bg_color, disabled_icon_fill,
                                padding
                            },
                            grid
                        }
                    }, button_protocol(list_name))
                }
                const li = document.createElement('li')
                li.setAttribute('role', 'none')
                if (disabled) li.setAttribute('disabled', disabled)
                li.append(item)
                shadow.append(li)
            })
            
        }
        function handle_expanded_event (data) {
            list.setAttribute('aria-hidden', data)
            list.setAttribute('aria-expanded', !data)
        }
        function handle_mutiple_selected ({make, from, lists, selected}) {
            const type = selected ? 'selected' : 'unselected'
            const message = make({type: 'selected', data: {selected: from}})
            recipients[from](make({type, data: selected}))
            lists.forEach( list => {
                const label = list.firstChild.getAttribute('aria-label') 
                if (label === from) list.setAttribute('aria-selected', selected)
            })
            send( message )
        }

        function handle_single_selected ({make, from, lists, selected}) {
            lists.forEach( list => {
                const label = list.firstChild.getAttribute('aria-label') 
                const state = label === from
                const type = state ? 'selected' : 'unselected'
                const name = state ? from : label
                recipients[name](make({type, data: state}))
                recipients[name](make({type: 'current', data: state}))
                list.setAttribute('aria-current', state)
                list.setAttribute('aria-selected', state)
            })
            const message = make({type: 'selected', data: {selected: from}})
            send( message )
        }
        function handle_select_event ({from, to, data}) {
            const {selected} = data
            // !important  <style> as a child into inject shadowDOM, only Safari and Firefox did, Chrome, Brave, Opera and Edge are not count <style> as a childElemenet
            const lists = shadow.firstChild.tagName !== 'STYLE' ? shadow.childNodes : [...shadow.childNodes].filter( (child, index) => index !== 0)
            const make = message_maker(`${from} / option / ${flow}`)
            if (mode === 'single-select')  handle_single_selected({make, from, lists, selected})
            if (mode === 'multiple-select') handle_mutiple_selected({make, from, lists, selected})
            
        }
        function button_protocol (name) {
            return (send) => {
                recipients[name] = send
                return get
            }
        }
        function handle_click_event(msg) {
            const {head, type, data} = msg
            const role = head[0].split(' / ')[1]
            const from = head[0].split(' / ')[0]
            const make = message_maker(`${from} / ${role} / ${flow}`)
            const message = make({to: '*', type, data})
            send(message)
        }
        function get (msg) {
            const {head, refs, type, data} = msg
            const to = head[1]
            const id = head[2]
            const role = head[0].split(' / ')[1]
            const from = head[0].split(' / ')[0]
            if (role === 'menuitem') return handle_click_event(msg)
            if (type === 'click' && role === 'option') return handle_select_event({from, to, data})
            if (type.match(/expanded|collapsed/)) return handle_expanded_event(data)
        }
    }

    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    if (theme && theme.props) {
        var {
            bg_color, bg_color_hover,
            current_bg_color, current_bg_color_hover, disabled_bg_color,
            width, height, border_width, border_style, border_opacity, border_color,
            border_color_hover, border_radius, padding,  opacity,
            shadow_color, offset_x, offset_y, blur, shadow_opacity,
            shadow_color_hover, offset_x_hover, offset_y_hover, blur_hover, shadow_opacity_hover
        } = theme.props
    }

    const style = `
    :host(i-list) {
        ${width && 'width: var(--width);'};
        ${height && 'height: var(--height);'};
        display: grid;
        ${make_grid(grid)}
        max-width: 100%;
    }
    :host(i-list[aria-hidden="true"]) {
        opacity: 0;
        animation: close 0.3s;
        pointer-events: none;
    }
    :host([aria-hidden="false"]) {
        animation: open 0.3s;
    }
    li {
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
        --border-radius: ${border_radius ? border_radius : 'var(--primary-radius)'};
        --border-width: ${border_width ? border_width : 'var(--primary-border-width)'};
        --border-style: ${border_style ? border_style : 'var(--primary-border-style)'};
        --border-color: ${border_color ? border_color : 'var(--primary-border-color)'};
        --border-opacity: ${border_opacity ? border_opacity : 'var(--primary-border-opacity)'};
        --border: var(--border-width) var(--border-style) hsla(var(--border-color), var(--border-opacity));
        display: grid;
        grid-template-columns: 1fr;
        background-color: hsl(var(--bg-color));
        border: var(--border);
        margin-top: -1px;
        cursor: pointer;
        transition: background-color 0.3s ease-in-out;
    }
    li:hover {
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--primary-bg-color-hover)'};
    }
    :host(i-list) li:nth-of-type(1) {
        border-top-left-radius: var(--border-radius);
        border-top-right-radius: var(--border-radius);
    }
    li:last-child {
        border-bottom-left-radius: var(--border-radius);
        border-bottom-right-radius: var(--border-radius);
    }
    [role="listitem"] {
        display: grid;
        grid-template-rows: 24px;
        padding: 11px;
        align-items: center;
    }
    [role="listitem"]:hover {
        cursor: default;
    }
    li[disabled="true"], li[disabled="true"]:hover {
        background-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        cursor: not-allowed;
    }
    [role="none"] {
        --bg-color: var(--list-bg-color);
        --opacity: 1;
        background-color: hsla(var(--bg-color), var(--opacity));
    }
    [role="none"]:hover {
        --bg-color: var(--list-bg-color-hover);
        --opacity: 1;
        background-color: hsla(var(--bg-color), var(--opacity));
    }
    [role="none"] i-link {
        padding: 12px;
    }
    [role="option"] i-button.icon-right, [role="option"] i-button.text-left {
        grid-template-columns: auto 1fr auto;
    }
    [aria-current="true"] {
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    @keyframes close {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    @keyframes open {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    ${custom_style}
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/node_modules/make-grid.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-grid.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/node_modules/message-maker.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/message-maker.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/node_modules/support-style-sheet.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/support-style-sheet.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperscript-attribute-to-property/index.js":[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js":[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else if (xstate === COMMENT && opts.comments) {
          reg += String(arg)
        } else if (xstate !== COMMENT) {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      if (opts.createFragment) return opts.createFragment(tree[2])
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else if (x === null || x === undefined) return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperscript-attribute-to-property/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/insert-css/index.js":[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/leaflet/dist/leaflet-src.js":[function(require,module,exports){
/* @preserve
 * Leaflet 1.7.1, a JS library for interactive maps. http://leafletjs.com
 * (c) 2010-2019 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.L = {})));
}(this, (function (exports) { 'use strict';

  var version = "1.7.1";

  /*
   * @namespace Util
   *
   * Various utility functions, used by Leaflet internally.
   */

  // @function extend(dest: Object, src?: Object): Object
  // Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.
  function extend(dest) {
  	var i, j, len, src;

  	for (j = 1, len = arguments.length; j < len; j++) {
  		src = arguments[j];
  		for (i in src) {
  			dest[i] = src[i];
  		}
  	}
  	return dest;
  }

  // @function create(proto: Object, properties?: Object): Object
  // Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
  var create = Object.create || (function () {
  	function F() {}
  	return function (proto) {
  		F.prototype = proto;
  		return new F();
  	};
  })();

  // @function bind(fn: Function, …): Function
  // Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
  // Has a `L.bind()` shortcut.
  function bind(fn, obj) {
  	var slice = Array.prototype.slice;

  	if (fn.bind) {
  		return fn.bind.apply(fn, slice.call(arguments, 1));
  	}

  	var args = slice.call(arguments, 2);

  	return function () {
  		return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
  	};
  }

  // @property lastId: Number
  // Last unique ID used by [`stamp()`](#util-stamp)
  var lastId = 0;

  // @function stamp(obj: Object): Number
  // Returns the unique ID of an object, assigning it one if it doesn't have it.
  function stamp(obj) {
  	/*eslint-disable */
  	obj._leaflet_id = obj._leaflet_id || ++lastId;
  	return obj._leaflet_id;
  	/* eslint-enable */
  }

  // @function throttle(fn: Function, time: Number, context: Object): Function
  // Returns a function which executes function `fn` with the given scope `context`
  // (so that the `this` keyword refers to `context` inside `fn`'s code). The function
  // `fn` will be called no more than one time per given amount of `time`. The arguments
  // received by the bound function will be any arguments passed when binding the
  // function, followed by any arguments passed when invoking the bound function.
  // Has an `L.throttle` shortcut.
  function throttle(fn, time, context) {
  	var lock, args, wrapperFn, later;

  	later = function () {
  		// reset lock and call if queued
  		lock = false;
  		if (args) {
  			wrapperFn.apply(context, args);
  			args = false;
  		}
  	};

  	wrapperFn = function () {
  		if (lock) {
  			// called too soon, queue to call later
  			args = arguments;

  		} else {
  			// call and lock until later
  			fn.apply(context, arguments);
  			setTimeout(later, time);
  			lock = true;
  		}
  	};

  	return wrapperFn;
  }

  // @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
  // Returns the number `num` modulo `range` in such a way so it lies within
  // `range[0]` and `range[1]`. The returned value will be always smaller than
  // `range[1]` unless `includeMax` is set to `true`.
  function wrapNum(x, range, includeMax) {
  	var max = range[1],
  	    min = range[0],
  	    d = max - min;
  	return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
  }

  // @function falseFn(): Function
  // Returns a function which always returns `false`.
  function falseFn() { return false; }

  // @function formatNum(num: Number, digits?: Number): Number
  // Returns the number `num` rounded to `digits` decimals, or to 6 decimals by default.
  function formatNum(num, digits) {
  	var pow = Math.pow(10, (digits === undefined ? 6 : digits));
  	return Math.round(num * pow) / pow;
  }

  // @function trim(str: String): String
  // Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
  function trim(str) {
  	return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
  }

  // @function splitWords(str: String): String[]
  // Trims and splits the string on whitespace and returns the array of parts.
  function splitWords(str) {
  	return trim(str).split(/\s+/);
  }

  // @function setOptions(obj: Object, options: Object): Object
  // Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `L.setOptions` shortcut.
  function setOptions(obj, options) {
  	if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
  		obj.options = obj.options ? create(obj.options) : {};
  	}
  	for (var i in options) {
  		obj.options[i] = options[i];
  	}
  	return obj.options;
  }

  // @function getParamString(obj: Object, existingUrl?: String, uppercase?: Boolean): String
  // Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
  // translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
  // be appended at the end. If `uppercase` is `true`, the parameter names will
  // be uppercased (e.g. `'?A=foo&B=bar'`)
  function getParamString(obj, existingUrl, uppercase) {
  	var params = [];
  	for (var i in obj) {
  		params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
  	}
  	return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
  }

  var templateRe = /\{ *([\w_-]+) *\}/g;

  // @function template(str: String, data: Object): String
  // Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
  // and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
  // `('Hello foo, bar')`. You can also specify functions instead of strings for
  // data values — they will be evaluated passing `data` as an argument.
  function template(str, data) {
  	return str.replace(templateRe, function (str, key) {
  		var value = data[key];

  		if (value === undefined) {
  			throw new Error('No value provided for variable ' + str);

  		} else if (typeof value === 'function') {
  			value = value(data);
  		}
  		return value;
  	});
  }

  // @function isArray(obj): Boolean
  // Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
  var isArray = Array.isArray || function (obj) {
  	return (Object.prototype.toString.call(obj) === '[object Array]');
  };

  // @function indexOf(array: Array, el: Object): Number
  // Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
  function indexOf(array, el) {
  	for (var i = 0; i < array.length; i++) {
  		if (array[i] === el) { return i; }
  	}
  	return -1;
  }

  // @property emptyImageUrl: String
  // Data URI string containing a base64-encoded empty GIF image.
  // Used as a hack to free memory from unused images on WebKit-powered
  // mobile devices (by setting image `src` to this string).
  var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

  // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

  function getPrefixed(name) {
  	return window['webkit' + name] || window['moz' + name] || window['ms' + name];
  }

  var lastTime = 0;

  // fallback for IE 7-8
  function timeoutDefer(fn) {
  	var time = +new Date(),
  	    timeToCall = Math.max(0, 16 - (time - lastTime));

  	lastTime = time + timeToCall;
  	return window.setTimeout(fn, timeToCall);
  }

  var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;
  var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
  		getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };

  // @function requestAnimFrame(fn: Function, context?: Object, immediate?: Boolean): Number
  // Schedules `fn` to be executed when the browser repaints. `fn` is bound to
  // `context` if given. When `immediate` is set, `fn` is called immediately if
  // the browser doesn't have native support for
  // [`window.requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame),
  // otherwise it's delayed. Returns a request ID that can be used to cancel the request.
  function requestAnimFrame(fn, context, immediate) {
  	if (immediate && requestFn === timeoutDefer) {
  		fn.call(context);
  	} else {
  		return requestFn.call(window, bind(fn, context));
  	}
  }

  // @function cancelAnimFrame(id: Number): undefined
  // Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).
  function cancelAnimFrame(id) {
  	if (id) {
  		cancelFn.call(window, id);
  	}
  }

  var Util = ({
    extend: extend,
    create: create,
    bind: bind,
    lastId: lastId,
    stamp: stamp,
    throttle: throttle,
    wrapNum: wrapNum,
    falseFn: falseFn,
    formatNum: formatNum,
    trim: trim,
    splitWords: splitWords,
    setOptions: setOptions,
    getParamString: getParamString,
    template: template,
    isArray: isArray,
    indexOf: indexOf,
    emptyImageUrl: emptyImageUrl,
    requestFn: requestFn,
    cancelFn: cancelFn,
    requestAnimFrame: requestAnimFrame,
    cancelAnimFrame: cancelAnimFrame
  });

  // @class Class
  // @aka L.Class

  // @section
  // @uninheritable

  // Thanks to John Resig and Dean Edwards for inspiration!

  function Class() {}

  Class.extend = function (props) {

  	// @function extend(props: Object): Function
  	// [Extends the current class](#class-inheritance) given the properties to be included.
  	// Returns a Javascript function that is a class constructor (to be called with `new`).
  	var NewClass = function () {

  		// call the constructor
  		if (this.initialize) {
  			this.initialize.apply(this, arguments);
  		}

  		// call all constructor hooks
  		this.callInitHooks();
  	};

  	var parentProto = NewClass.__super__ = this.prototype;

  	var proto = create(parentProto);
  	proto.constructor = NewClass;

  	NewClass.prototype = proto;

  	// inherit parent's statics
  	for (var i in this) {
  		if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
  			NewClass[i] = this[i];
  		}
  	}

  	// mix static properties into the class
  	if (props.statics) {
  		extend(NewClass, props.statics);
  		delete props.statics;
  	}

  	// mix includes into the prototype
  	if (props.includes) {
  		checkDeprecatedMixinEvents(props.includes);
  		extend.apply(null, [proto].concat(props.includes));
  		delete props.includes;
  	}

  	// merge options
  	if (proto.options) {
  		props.options = extend(create(proto.options), props.options);
  	}

  	// mix given properties into the prototype
  	extend(proto, props);

  	proto._initHooks = [];

  	// add method for calling all hooks
  	proto.callInitHooks = function () {

  		if (this._initHooksCalled) { return; }

  		if (parentProto.callInitHooks) {
  			parentProto.callInitHooks.call(this);
  		}

  		this._initHooksCalled = true;

  		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
  			proto._initHooks[i].call(this);
  		}
  	};

  	return NewClass;
  };


  // @function include(properties: Object): this
  // [Includes a mixin](#class-includes) into the current class.
  Class.include = function (props) {
  	extend(this.prototype, props);
  	return this;
  };

  // @function mergeOptions(options: Object): this
  // [Merges `options`](#class-options) into the defaults of the class.
  Class.mergeOptions = function (options) {
  	extend(this.prototype.options, options);
  	return this;
  };

  // @function addInitHook(fn: Function): this
  // Adds a [constructor hook](#class-constructor-hooks) to the class.
  Class.addInitHook = function (fn) { // (Function) || (String, args...)
  	var args = Array.prototype.slice.call(arguments, 1);

  	var init = typeof fn === 'function' ? fn : function () {
  		this[fn].apply(this, args);
  	};

  	this.prototype._initHooks = this.prototype._initHooks || [];
  	this.prototype._initHooks.push(init);
  	return this;
  };

  function checkDeprecatedMixinEvents(includes) {
  	if (typeof L === 'undefined' || !L || !L.Mixin) { return; }

  	includes = isArray(includes) ? includes : [includes];

  	for (var i = 0; i < includes.length; i++) {
  		if (includes[i] === L.Mixin.Events) {
  			console.warn('Deprecated include of L.Mixin.Events: ' +
  				'this property will be removed in future releases, ' +
  				'please inherit from L.Evented instead.', new Error().stack);
  		}
  	}
  }

  /*
   * @class Evented
   * @aka L.Evented
   * @inherits Class
   *
   * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
   *
   * @example
   *
   * ```js
   * map.on('click', function(e) {
   * 	alert(e.latlng);
   * } );
   * ```
   *
   * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
   *
   * ```js
   * function onClick(e) { ... }
   *
   * map.on('click', onClick);
   * map.off('click', onClick);
   * ```
   */

  var Events = {
  	/* @method on(type: String, fn: Function, context?: Object): this
  	 * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
  	 *
  	 * @alternative
  	 * @method on(eventMap: Object): this
  	 * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
  	 */
  	on: function (types, fn, context) {

  		// types can be a map of types/handlers
  		if (typeof types === 'object') {
  			for (var type in types) {
  				// we don't process space-separated events here for performance;
  				// it's a hot path since Layer uses the on(obj) syntax
  				this._on(type, types[type], fn);
  			}

  		} else {
  			// types can be a string of space-separated words
  			types = splitWords(types);

  			for (var i = 0, len = types.length; i < len; i++) {
  				this._on(types[i], fn, context);
  			}
  		}

  		return this;
  	},

  	/* @method off(type: String, fn?: Function, context?: Object): this
  	 * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
  	 *
  	 * @alternative
  	 * @method off(eventMap: Object): this
  	 * Removes a set of type/listener pairs.
  	 *
  	 * @alternative
  	 * @method off: this
  	 * Removes all listeners to all events on the object. This includes implicitly attached events.
  	 */
  	off: function (types, fn, context) {

  		if (!types) {
  			// clear all listeners if called without arguments
  			delete this._events;

  		} else if (typeof types === 'object') {
  			for (var type in types) {
  				this._off(type, types[type], fn);
  			}

  		} else {
  			types = splitWords(types);

  			for (var i = 0, len = types.length; i < len; i++) {
  				this._off(types[i], fn, context);
  			}
  		}

  		return this;
  	},

  	// attach listener (without syntactic sugar now)
  	_on: function (type, fn, context) {
  		this._events = this._events || {};

  		/* get/init listeners for type */
  		var typeListeners = this._events[type];
  		if (!typeListeners) {
  			typeListeners = [];
  			this._events[type] = typeListeners;
  		}

  		if (context === this) {
  			// Less memory footprint.
  			context = undefined;
  		}
  		var newListener = {fn: fn, ctx: context},
  		    listeners = typeListeners;

  		// check if fn already there
  		for (var i = 0, len = listeners.length; i < len; i++) {
  			if (listeners[i].fn === fn && listeners[i].ctx === context) {
  				return;
  			}
  		}

  		listeners.push(newListener);
  	},

  	_off: function (type, fn, context) {
  		var listeners,
  		    i,
  		    len;

  		if (!this._events) { return; }

  		listeners = this._events[type];

  		if (!listeners) {
  			return;
  		}

  		if (!fn) {
  			// Set all removed listeners to noop so they are not called if remove happens in fire
  			for (i = 0, len = listeners.length; i < len; i++) {
  				listeners[i].fn = falseFn;
  			}
  			// clear all listeners for a type if function isn't specified
  			delete this._events[type];
  			return;
  		}

  		if (context === this) {
  			context = undefined;
  		}

  		if (listeners) {

  			// find fn and remove it
  			for (i = 0, len = listeners.length; i < len; i++) {
  				var l = listeners[i];
  				if (l.ctx !== context) { continue; }
  				if (l.fn === fn) {

  					// set the removed listener to noop so that's not called if remove happens in fire
  					l.fn = falseFn;

  					if (this._firingCount) {
  						/* copy array in case events are being fired */
  						this._events[type] = listeners = listeners.slice();
  					}
  					listeners.splice(i, 1);

  					return;
  				}
  			}
  		}
  	},

  	// @method fire(type: String, data?: Object, propagate?: Boolean): this
  	// Fires an event of the specified type. You can optionally provide an data
  	// object — the first argument of the listener function will contain its
  	// properties. The event can optionally be propagated to event parents.
  	fire: function (type, data, propagate) {
  		if (!this.listens(type, propagate)) { return this; }

  		var event = extend({}, data, {
  			type: type,
  			target: this,
  			sourceTarget: data && data.sourceTarget || this
  		});

  		if (this._events) {
  			var listeners = this._events[type];

  			if (listeners) {
  				this._firingCount = (this._firingCount + 1) || 1;
  				for (var i = 0, len = listeners.length; i < len; i++) {
  					var l = listeners[i];
  					l.fn.call(l.ctx || this, event);
  				}

  				this._firingCount--;
  			}
  		}

  		if (propagate) {
  			// propagate the event to parents (set with addEventParent)
  			this._propagateEvent(event);
  		}

  		return this;
  	},

  	// @method listens(type: String): Boolean
  	// Returns `true` if a particular event type has any listeners attached to it.
  	listens: function (type, propagate) {
  		var listeners = this._events && this._events[type];
  		if (listeners && listeners.length) { return true; }

  		if (propagate) {
  			// also check parents for listeners if event propagates
  			for (var id in this._eventParents) {
  				if (this._eventParents[id].listens(type, propagate)) { return true; }
  			}
  		}
  		return false;
  	},

  	// @method once(…): this
  	// Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
  	once: function (types, fn, context) {

  		if (typeof types === 'object') {
  			for (var type in types) {
  				this.once(type, types[type], fn);
  			}
  			return this;
  		}

  		var handler = bind(function () {
  			this
  			    .off(types, fn, context)
  			    .off(types, handler, context);
  		}, this);

  		// add a listener that's executed once and removed after that
  		return this
  		    .on(types, fn, context)
  		    .on(types, handler, context);
  	},

  	// @method addEventParent(obj: Evented): this
  	// Adds an event parent - an `Evented` that will receive propagated events
  	addEventParent: function (obj) {
  		this._eventParents = this._eventParents || {};
  		this._eventParents[stamp(obj)] = obj;
  		return this;
  	},

  	// @method removeEventParent(obj: Evented): this
  	// Removes an event parent, so it will stop receiving propagated events
  	removeEventParent: function (obj) {
  		if (this._eventParents) {
  			delete this._eventParents[stamp(obj)];
  		}
  		return this;
  	},

  	_propagateEvent: function (e) {
  		for (var id in this._eventParents) {
  			this._eventParents[id].fire(e.type, extend({
  				layer: e.target,
  				propagatedFrom: e.target
  			}, e), true);
  		}
  	}
  };

  // aliases; we should ditch those eventually

  // @method addEventListener(…): this
  // Alias to [`on(…)`](#evented-on)
  Events.addEventListener = Events.on;

  // @method removeEventListener(…): this
  // Alias to [`off(…)`](#evented-off)

  // @method clearAllEventListeners(…): this
  // Alias to [`off()`](#evented-off)
  Events.removeEventListener = Events.clearAllEventListeners = Events.off;

  // @method addOneTimeEventListener(…): this
  // Alias to [`once(…)`](#evented-once)
  Events.addOneTimeEventListener = Events.once;

  // @method fireEvent(…): this
  // Alias to [`fire(…)`](#evented-fire)
  Events.fireEvent = Events.fire;

  // @method hasEventListeners(…): Boolean
  // Alias to [`listens(…)`](#evented-listens)
  Events.hasEventListeners = Events.listens;

  var Evented = Class.extend(Events);

  /*
   * @class Point
   * @aka L.Point
   *
   * Represents a point with `x` and `y` coordinates in pixels.
   *
   * @example
   *
   * ```js
   * var point = L.point(200, 300);
   * ```
   *
   * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
   *
   * ```js
   * map.panBy([200, 300]);
   * map.panBy(L.point(200, 300));
   * ```
   *
   * Note that `Point` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */

  function Point(x, y, round) {
  	// @property x: Number; The `x` coordinate of the point
  	this.x = (round ? Math.round(x) : x);
  	// @property y: Number; The `y` coordinate of the point
  	this.y = (round ? Math.round(y) : y);
  }

  var trunc = Math.trunc || function (v) {
  	return v > 0 ? Math.floor(v) : Math.ceil(v);
  };

  Point.prototype = {

  	// @method clone(): Point
  	// Returns a copy of the current point.
  	clone: function () {
  		return new Point(this.x, this.y);
  	},

  	// @method add(otherPoint: Point): Point
  	// Returns the result of addition of the current and the given points.
  	add: function (point) {
  		// non-destructive, returns a new point
  		return this.clone()._add(toPoint(point));
  	},

  	_add: function (point) {
  		// destructive, used directly for performance in situations where it's safe to modify existing point
  		this.x += point.x;
  		this.y += point.y;
  		return this;
  	},

  	// @method subtract(otherPoint: Point): Point
  	// Returns the result of subtraction of the given point from the current.
  	subtract: function (point) {
  		return this.clone()._subtract(toPoint(point));
  	},

  	_subtract: function (point) {
  		this.x -= point.x;
  		this.y -= point.y;
  		return this;
  	},

  	// @method divideBy(num: Number): Point
  	// Returns the result of division of the current point by the given number.
  	divideBy: function (num) {
  		return this.clone()._divideBy(num);
  	},

  	_divideBy: function (num) {
  		this.x /= num;
  		this.y /= num;
  		return this;
  	},

  	// @method multiplyBy(num: Number): Point
  	// Returns the result of multiplication of the current point by the given number.
  	multiplyBy: function (num) {
  		return this.clone()._multiplyBy(num);
  	},

  	_multiplyBy: function (num) {
  		this.x *= num;
  		this.y *= num;
  		return this;
  	},

  	// @method scaleBy(scale: Point): Point
  	// Multiply each coordinate of the current point by each coordinate of
  	// `scale`. In linear algebra terms, multiply the point by the
  	// [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
  	// defined by `scale`.
  	scaleBy: function (point) {
  		return new Point(this.x * point.x, this.y * point.y);
  	},

  	// @method unscaleBy(scale: Point): Point
  	// Inverse of `scaleBy`. Divide each coordinate of the current point by
  	// each coordinate of `scale`.
  	unscaleBy: function (point) {
  		return new Point(this.x / point.x, this.y / point.y);
  	},

  	// @method round(): Point
  	// Returns a copy of the current point with rounded coordinates.
  	round: function () {
  		return this.clone()._round();
  	},

  	_round: function () {
  		this.x = Math.round(this.x);
  		this.y = Math.round(this.y);
  		return this;
  	},

  	// @method floor(): Point
  	// Returns a copy of the current point with floored coordinates (rounded down).
  	floor: function () {
  		return this.clone()._floor();
  	},

  	_floor: function () {
  		this.x = Math.floor(this.x);
  		this.y = Math.floor(this.y);
  		return this;
  	},

  	// @method ceil(): Point
  	// Returns a copy of the current point with ceiled coordinates (rounded up).
  	ceil: function () {
  		return this.clone()._ceil();
  	},

  	_ceil: function () {
  		this.x = Math.ceil(this.x);
  		this.y = Math.ceil(this.y);
  		return this;
  	},

  	// @method trunc(): Point
  	// Returns a copy of the current point with truncated coordinates (rounded towards zero).
  	trunc: function () {
  		return this.clone()._trunc();
  	},

  	_trunc: function () {
  		this.x = trunc(this.x);
  		this.y = trunc(this.y);
  		return this;
  	},

  	// @method distanceTo(otherPoint: Point): Number
  	// Returns the cartesian distance between the current and the given points.
  	distanceTo: function (point) {
  		point = toPoint(point);

  		var x = point.x - this.x,
  		    y = point.y - this.y;

  		return Math.sqrt(x * x + y * y);
  	},

  	// @method equals(otherPoint: Point): Boolean
  	// Returns `true` if the given point has the same coordinates.
  	equals: function (point) {
  		point = toPoint(point);

  		return point.x === this.x &&
  		       point.y === this.y;
  	},

  	// @method contains(otherPoint: Point): Boolean
  	// Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
  	contains: function (point) {
  		point = toPoint(point);

  		return Math.abs(point.x) <= Math.abs(this.x) &&
  		       Math.abs(point.y) <= Math.abs(this.y);
  	},

  	// @method toString(): String
  	// Returns a string representation of the point for debugging purposes.
  	toString: function () {
  		return 'Point(' +
  		        formatNum(this.x) + ', ' +
  		        formatNum(this.y) + ')';
  	}
  };

  // @factory L.point(x: Number, y: Number, round?: Boolean)
  // Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.

  // @alternative
  // @factory L.point(coords: Number[])
  // Expects an array of the form `[x, y]` instead.

  // @alternative
  // @factory L.point(coords: Object)
  // Expects a plain object of the form `{x: Number, y: Number}` instead.
  function toPoint(x, y, round) {
  	if (x instanceof Point) {
  		return x;
  	}
  	if (isArray(x)) {
  		return new Point(x[0], x[1]);
  	}
  	if (x === undefined || x === null) {
  		return x;
  	}
  	if (typeof x === 'object' && 'x' in x && 'y' in x) {
  		return new Point(x.x, x.y);
  	}
  	return new Point(x, y, round);
  }

  /*
   * @class Bounds
   * @aka L.Bounds
   *
   * Represents a rectangular area in pixel coordinates.
   *
   * @example
   *
   * ```js
   * var p1 = L.point(10, 10),
   * p2 = L.point(40, 60),
   * bounds = L.bounds(p1, p2);
   * ```
   *
   * All Leaflet methods that accept `Bounds` objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
   *
   * ```js
   * otherBounds.intersects([[10, 10], [40, 60]]);
   * ```
   *
   * Note that `Bounds` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */

  function Bounds(a, b) {
  	if (!a) { return; }

  	var points = b ? [a, b] : a;

  	for (var i = 0, len = points.length; i < len; i++) {
  		this.extend(points[i]);
  	}
  }

  Bounds.prototype = {
  	// @method extend(point: Point): this
  	// Extends the bounds to contain the given point.
  	extend: function (point) { // (Point)
  		point = toPoint(point);

  		// @property min: Point
  		// The top left corner of the rectangle.
  		// @property max: Point
  		// The bottom right corner of the rectangle.
  		if (!this.min && !this.max) {
  			this.min = point.clone();
  			this.max = point.clone();
  		} else {
  			this.min.x = Math.min(point.x, this.min.x);
  			this.max.x = Math.max(point.x, this.max.x);
  			this.min.y = Math.min(point.y, this.min.y);
  			this.max.y = Math.max(point.y, this.max.y);
  		}
  		return this;
  	},

  	// @method getCenter(round?: Boolean): Point
  	// Returns the center point of the bounds.
  	getCenter: function (round) {
  		return new Point(
  		        (this.min.x + this.max.x) / 2,
  		        (this.min.y + this.max.y) / 2, round);
  	},

  	// @method getBottomLeft(): Point
  	// Returns the bottom-left point of the bounds.
  	getBottomLeft: function () {
  		return new Point(this.min.x, this.max.y);
  	},

  	// @method getTopRight(): Point
  	// Returns the top-right point of the bounds.
  	getTopRight: function () { // -> Point
  		return new Point(this.max.x, this.min.y);
  	},

  	// @method getTopLeft(): Point
  	// Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
  	getTopLeft: function () {
  		return this.min; // left, top
  	},

  	// @method getBottomRight(): Point
  	// Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
  	getBottomRight: function () {
  		return this.max; // right, bottom
  	},

  	// @method getSize(): Point
  	// Returns the size of the given bounds
  	getSize: function () {
  		return this.max.subtract(this.min);
  	},

  	// @method contains(otherBounds: Bounds): Boolean
  	// Returns `true` if the rectangle contains the given one.
  	// @alternative
  	// @method contains(point: Point): Boolean
  	// Returns `true` if the rectangle contains the given point.
  	contains: function (obj) {
  		var min, max;

  		if (typeof obj[0] === 'number' || obj instanceof Point) {
  			obj = toPoint(obj);
  		} else {
  			obj = toBounds(obj);
  		}

  		if (obj instanceof Bounds) {
  			min = obj.min;
  			max = obj.max;
  		} else {
  			min = max = obj;
  		}

  		return (min.x >= this.min.x) &&
  		       (max.x <= this.max.x) &&
  		       (min.y >= this.min.y) &&
  		       (max.y <= this.max.y);
  	},

  	// @method intersects(otherBounds: Bounds): Boolean
  	// Returns `true` if the rectangle intersects the given bounds. Two bounds
  	// intersect if they have at least one point in common.
  	intersects: function (bounds) { // (Bounds) -> Boolean
  		bounds = toBounds(bounds);

  		var min = this.min,
  		    max = this.max,
  		    min2 = bounds.min,
  		    max2 = bounds.max,
  		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
  		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

  		return xIntersects && yIntersects;
  	},

  	// @method overlaps(otherBounds: Bounds): Boolean
  	// Returns `true` if the rectangle overlaps the given bounds. Two bounds
  	// overlap if their intersection is an area.
  	overlaps: function (bounds) { // (Bounds) -> Boolean
  		bounds = toBounds(bounds);

  		var min = this.min,
  		    max = this.max,
  		    min2 = bounds.min,
  		    max2 = bounds.max,
  		    xOverlaps = (max2.x > min.x) && (min2.x < max.x),
  		    yOverlaps = (max2.y > min.y) && (min2.y < max.y);

  		return xOverlaps && yOverlaps;
  	},

  	isValid: function () {
  		return !!(this.min && this.max);
  	}
  };


  // @factory L.bounds(corner1: Point, corner2: Point)
  // Creates a Bounds object from two corners coordinate pairs.
  // @alternative
  // @factory L.bounds(points: Point[])
  // Creates a Bounds object from the given array of points.
  function toBounds(a, b) {
  	if (!a || a instanceof Bounds) {
  		return a;
  	}
  	return new Bounds(a, b);
  }

  /*
   * @class LatLngBounds
   * @aka L.LatLngBounds
   *
   * Represents a rectangular geographical area on a map.
   *
   * @example
   *
   * ```js
   * var corner1 = L.latLng(40.712, -74.227),
   * corner2 = L.latLng(40.774, -74.125),
   * bounds = L.latLngBounds(corner1, corner2);
   * ```
   *
   * All Leaflet methods that accept LatLngBounds objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
   *
   * ```js
   * map.fitBounds([
   * 	[40.712, -74.227],
   * 	[40.774, -74.125]
   * ]);
   * ```
   *
   * Caution: if the area crosses the antimeridian (often confused with the International Date Line), you must specify corners _outside_ the [-180, 180] degrees longitude range.
   *
   * Note that `LatLngBounds` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */

  function LatLngBounds(corner1, corner2) { // (LatLng, LatLng) or (LatLng[])
  	if (!corner1) { return; }

  	var latlngs = corner2 ? [corner1, corner2] : corner1;

  	for (var i = 0, len = latlngs.length; i < len; i++) {
  		this.extend(latlngs[i]);
  	}
  }

  LatLngBounds.prototype = {

  	// @method extend(latlng: LatLng): this
  	// Extend the bounds to contain the given point

  	// @alternative
  	// @method extend(otherBounds: LatLngBounds): this
  	// Extend the bounds to contain the given bounds
  	extend: function (obj) {
  		var sw = this._southWest,
  		    ne = this._northEast,
  		    sw2, ne2;

  		if (obj instanceof LatLng) {
  			sw2 = obj;
  			ne2 = obj;

  		} else if (obj instanceof LatLngBounds) {
  			sw2 = obj._southWest;
  			ne2 = obj._northEast;

  			if (!sw2 || !ne2) { return this; }

  		} else {
  			return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
  		}

  		if (!sw && !ne) {
  			this._southWest = new LatLng(sw2.lat, sw2.lng);
  			this._northEast = new LatLng(ne2.lat, ne2.lng);
  		} else {
  			sw.lat = Math.min(sw2.lat, sw.lat);
  			sw.lng = Math.min(sw2.lng, sw.lng);
  			ne.lat = Math.max(ne2.lat, ne.lat);
  			ne.lng = Math.max(ne2.lng, ne.lng);
  		}

  		return this;
  	},

  	// @method pad(bufferRatio: Number): LatLngBounds
  	// Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
  	// For example, a ratio of 0.5 extends the bounds by 50% in each direction.
  	// Negative values will retract the bounds.
  	pad: function (bufferRatio) {
  		var sw = this._southWest,
  		    ne = this._northEast,
  		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
  		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

  		return new LatLngBounds(
  		        new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
  		        new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
  	},

  	// @method getCenter(): LatLng
  	// Returns the center point of the bounds.
  	getCenter: function () {
  		return new LatLng(
  		        (this._southWest.lat + this._northEast.lat) / 2,
  		        (this._southWest.lng + this._northEast.lng) / 2);
  	},

  	// @method getSouthWest(): LatLng
  	// Returns the south-west point of the bounds.
  	getSouthWest: function () {
  		return this._southWest;
  	},

  	// @method getNorthEast(): LatLng
  	// Returns the north-east point of the bounds.
  	getNorthEast: function () {
  		return this._northEast;
  	},

  	// @method getNorthWest(): LatLng
  	// Returns the north-west point of the bounds.
  	getNorthWest: function () {
  		return new LatLng(this.getNorth(), this.getWest());
  	},

  	// @method getSouthEast(): LatLng
  	// Returns the south-east point of the bounds.
  	getSouthEast: function () {
  		return new LatLng(this.getSouth(), this.getEast());
  	},

  	// @method getWest(): Number
  	// Returns the west longitude of the bounds
  	getWest: function () {
  		return this._southWest.lng;
  	},

  	// @method getSouth(): Number
  	// Returns the south latitude of the bounds
  	getSouth: function () {
  		return this._southWest.lat;
  	},

  	// @method getEast(): Number
  	// Returns the east longitude of the bounds
  	getEast: function () {
  		return this._northEast.lng;
  	},

  	// @method getNorth(): Number
  	// Returns the north latitude of the bounds
  	getNorth: function () {
  		return this._northEast.lat;
  	},

  	// @method contains(otherBounds: LatLngBounds): Boolean
  	// Returns `true` if the rectangle contains the given one.

  	// @alternative
  	// @method contains (latlng: LatLng): Boolean
  	// Returns `true` if the rectangle contains the given point.
  	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
  		if (typeof obj[0] === 'number' || obj instanceof LatLng || 'lat' in obj) {
  			obj = toLatLng(obj);
  		} else {
  			obj = toLatLngBounds(obj);
  		}

  		var sw = this._southWest,
  		    ne = this._northEast,
  		    sw2, ne2;

  		if (obj instanceof LatLngBounds) {
  			sw2 = obj.getSouthWest();
  			ne2 = obj.getNorthEast();
  		} else {
  			sw2 = ne2 = obj;
  		}

  		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
  		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
  	},

  	// @method intersects(otherBounds: LatLngBounds): Boolean
  	// Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
  	intersects: function (bounds) {
  		bounds = toLatLngBounds(bounds);

  		var sw = this._southWest,
  		    ne = this._northEast,
  		    sw2 = bounds.getSouthWest(),
  		    ne2 = bounds.getNorthEast(),

  		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
  		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

  		return latIntersects && lngIntersects;
  	},

  	// @method overlaps(otherBounds: LatLngBounds): Boolean
  	// Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
  	overlaps: function (bounds) {
  		bounds = toLatLngBounds(bounds);

  		var sw = this._southWest,
  		    ne = this._northEast,
  		    sw2 = bounds.getSouthWest(),
  		    ne2 = bounds.getNorthEast(),

  		    latOverlaps = (ne2.lat > sw.lat) && (sw2.lat < ne.lat),
  		    lngOverlaps = (ne2.lng > sw.lng) && (sw2.lng < ne.lng);

  		return latOverlaps && lngOverlaps;
  	},

  	// @method toBBoxString(): String
  	// Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
  	toBBoxString: function () {
  		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
  	},

  	// @method equals(otherBounds: LatLngBounds, maxMargin?: Number): Boolean
  	// Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
  	equals: function (bounds, maxMargin) {
  		if (!bounds) { return false; }

  		bounds = toLatLngBounds(bounds);

  		return this._southWest.equals(bounds.getSouthWest(), maxMargin) &&
  		       this._northEast.equals(bounds.getNorthEast(), maxMargin);
  	},

  	// @method isValid(): Boolean
  	// Returns `true` if the bounds are properly initialized.
  	isValid: function () {
  		return !!(this._southWest && this._northEast);
  	}
  };

  // TODO International date line?

  // @factory L.latLngBounds(corner1: LatLng, corner2: LatLng)
  // Creates a `LatLngBounds` object by defining two diagonally opposite corners of the rectangle.

  // @alternative
  // @factory L.latLngBounds(latlngs: LatLng[])
  // Creates a `LatLngBounds` object defined by the geographical points it contains. Very useful for zooming the map to fit a particular set of locations with [`fitBounds`](#map-fitbounds).
  function toLatLngBounds(a, b) {
  	if (a instanceof LatLngBounds) {
  		return a;
  	}
  	return new LatLngBounds(a, b);
  }

  /* @class LatLng
   * @aka L.LatLng
   *
   * Represents a geographical point with a certain latitude and longitude.
   *
   * @example
   *
   * ```
   * var latlng = L.latLng(50.5, 30.5);
   * ```
   *
   * All Leaflet methods that accept LatLng objects also accept them in a simple Array form and simple object form (unless noted otherwise), so these lines are equivalent:
   *
   * ```
   * map.panTo([50, 30]);
   * map.panTo({lon: 30, lat: 50});
   * map.panTo({lat: 50, lng: 30});
   * map.panTo(L.latLng(50, 30));
   * ```
   *
   * Note that `LatLng` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */

  function LatLng(lat, lng, alt) {
  	if (isNaN(lat) || isNaN(lng)) {
  		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
  	}

  	// @property lat: Number
  	// Latitude in degrees
  	this.lat = +lat;

  	// @property lng: Number
  	// Longitude in degrees
  	this.lng = +lng;

  	// @property alt: Number
  	// Altitude in meters (optional)
  	if (alt !== undefined) {
  		this.alt = +alt;
  	}
  }

  LatLng.prototype = {
  	// @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
  	// Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
  	equals: function (obj, maxMargin) {
  		if (!obj) { return false; }

  		obj = toLatLng(obj);

  		var margin = Math.max(
  		        Math.abs(this.lat - obj.lat),
  		        Math.abs(this.lng - obj.lng));

  		return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
  	},

  	// @method toString(): String
  	// Returns a string representation of the point (for debugging purposes).
  	toString: function (precision) {
  		return 'LatLng(' +
  		        formatNum(this.lat, precision) + ', ' +
  		        formatNum(this.lng, precision) + ')';
  	},

  	// @method distanceTo(otherLatLng: LatLng): Number
  	// Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
  	distanceTo: function (other) {
  		return Earth.distance(this, toLatLng(other));
  	},

  	// @method wrap(): LatLng
  	// Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
  	wrap: function () {
  		return Earth.wrapLatLng(this);
  	},

  	// @method toBounds(sizeInMeters: Number): LatLngBounds
  	// Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
  	toBounds: function (sizeInMeters) {
  		var latAccuracy = 180 * sizeInMeters / 40075017,
  		    lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

  		return toLatLngBounds(
  		        [this.lat - latAccuracy, this.lng - lngAccuracy],
  		        [this.lat + latAccuracy, this.lng + lngAccuracy]);
  	},

  	clone: function () {
  		return new LatLng(this.lat, this.lng, this.alt);
  	}
  };



  // @factory L.latLng(latitude: Number, longitude: Number, altitude?: Number): LatLng
  // Creates an object representing a geographical point with the given latitude and longitude (and optionally altitude).

  // @alternative
  // @factory L.latLng(coords: Array): LatLng
  // Expects an array of the form `[Number, Number]` or `[Number, Number, Number]` instead.

  // @alternative
  // @factory L.latLng(coords: Object): LatLng
  // Expects an plain object of the form `{lat: Number, lng: Number}` or `{lat: Number, lng: Number, alt: Number}` instead.

  function toLatLng(a, b, c) {
  	if (a instanceof LatLng) {
  		return a;
  	}
  	if (isArray(a) && typeof a[0] !== 'object') {
  		if (a.length === 3) {
  			return new LatLng(a[0], a[1], a[2]);
  		}
  		if (a.length === 2) {
  			return new LatLng(a[0], a[1]);
  		}
  		return null;
  	}
  	if (a === undefined || a === null) {
  		return a;
  	}
  	if (typeof a === 'object' && 'lat' in a) {
  		return new LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
  	}
  	if (b === undefined) {
  		return null;
  	}
  	return new LatLng(a, b, c);
  }

  /*
   * @namespace CRS
   * @crs L.CRS.Base
   * Object that defines coordinate reference systems for projecting
   * geographical points into pixel (screen) coordinates and back (and to
   * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services). See
   * [spatial reference system](http://en.wikipedia.org/wiki/Coordinate_reference_system).
   *
   * Leaflet defines the most usual CRSs by default. If you want to use a
   * CRS not defined by default, take a look at the
   * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) plugin.
   *
   * Note that the CRS instances do not inherit from Leaflet's `Class` object,
   * and can't be instantiated. Also, new classes can't inherit from them,
   * and methods can't be added to them with the `include` function.
   */

  var CRS = {
  	// @method latLngToPoint(latlng: LatLng, zoom: Number): Point
  	// Projects geographical coordinates into pixel coordinates for a given zoom.
  	latLngToPoint: function (latlng, zoom) {
  		var projectedPoint = this.projection.project(latlng),
  		    scale = this.scale(zoom);

  		return this.transformation._transform(projectedPoint, scale);
  	},

  	// @method pointToLatLng(point: Point, zoom: Number): LatLng
  	// The inverse of `latLngToPoint`. Projects pixel coordinates on a given
  	// zoom into geographical coordinates.
  	pointToLatLng: function (point, zoom) {
  		var scale = this.scale(zoom),
  		    untransformedPoint = this.transformation.untransform(point, scale);

  		return this.projection.unproject(untransformedPoint);
  	},

  	// @method project(latlng: LatLng): Point
  	// Projects geographical coordinates into coordinates in units accepted for
  	// this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
  	project: function (latlng) {
  		return this.projection.project(latlng);
  	},

  	// @method unproject(point: Point): LatLng
  	// Given a projected coordinate returns the corresponding LatLng.
  	// The inverse of `project`.
  	unproject: function (point) {
  		return this.projection.unproject(point);
  	},

  	// @method scale(zoom: Number): Number
  	// Returns the scale used when transforming projected coordinates into
  	// pixel coordinates for a particular zoom. For example, it returns
  	// `256 * 2^zoom` for Mercator-based CRS.
  	scale: function (zoom) {
  		return 256 * Math.pow(2, zoom);
  	},

  	// @method zoom(scale: Number): Number
  	// Inverse of `scale()`, returns the zoom level corresponding to a scale
  	// factor of `scale`.
  	zoom: function (scale) {
  		return Math.log(scale / 256) / Math.LN2;
  	},

  	// @method getProjectedBounds(zoom: Number): Bounds
  	// Returns the projection's bounds scaled and transformed for the provided `zoom`.
  	getProjectedBounds: function (zoom) {
  		if (this.infinite) { return null; }

  		var b = this.projection.bounds,
  		    s = this.scale(zoom),
  		    min = this.transformation.transform(b.min, s),
  		    max = this.transformation.transform(b.max, s);

  		return new Bounds(min, max);
  	},

  	// @method distance(latlng1: LatLng, latlng2: LatLng): Number
  	// Returns the distance between two geographical coordinates.

  	// @property code: String
  	// Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
  	//
  	// @property wrapLng: Number[]
  	// An array of two numbers defining whether the longitude (horizontal) coordinate
  	// axis wraps around a given range and how. Defaults to `[-180, 180]` in most
  	// geographical CRSs. If `undefined`, the longitude axis does not wrap around.
  	//
  	// @property wrapLat: Number[]
  	// Like `wrapLng`, but for the latitude (vertical) axis.

  	// wrapLng: [min, max],
  	// wrapLat: [min, max],

  	// @property infinite: Boolean
  	// If true, the coordinate space will be unbounded (infinite in both axes)
  	infinite: false,

  	// @method wrapLatLng(latlng: LatLng): LatLng
  	// Returns a `LatLng` where lat and lng has been wrapped according to the
  	// CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
  	wrapLatLng: function (latlng) {
  		var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
  		    lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
  		    alt = latlng.alt;

  		return new LatLng(lat, lng, alt);
  	},

  	// @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
  	// Returns a `LatLngBounds` with the same size as the given one, ensuring
  	// that its center is within the CRS's bounds.
  	// Only accepts actual `L.LatLngBounds` instances, not arrays.
  	wrapLatLngBounds: function (bounds) {
  		var center = bounds.getCenter(),
  		    newCenter = this.wrapLatLng(center),
  		    latShift = center.lat - newCenter.lat,
  		    lngShift = center.lng - newCenter.lng;

  		if (latShift === 0 && lngShift === 0) {
  			return bounds;
  		}

  		var sw = bounds.getSouthWest(),
  		    ne = bounds.getNorthEast(),
  		    newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
  		    newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);

  		return new LatLngBounds(newSw, newNe);
  	}
  };

  /*
   * @namespace CRS
   * @crs L.CRS.Earth
   *
   * Serves as the base for CRS that are global such that they cover the earth.
   * Can only be used as the base for other CRS and cannot be used directly,
   * since it does not have a `code`, `projection` or `transformation`. `distance()` returns
   * meters.
   */

  var Earth = extend({}, CRS, {
  	wrapLng: [-180, 180],

  	// Mean Earth Radius, as recommended for use by
  	// the International Union of Geodesy and Geophysics,
  	// see http://rosettacode.org/wiki/Haversine_formula
  	R: 6371000,

  	// distance between two geographical points using spherical law of cosines approximation
  	distance: function (latlng1, latlng2) {
  		var rad = Math.PI / 180,
  		    lat1 = latlng1.lat * rad,
  		    lat2 = latlng2.lat * rad,
  		    sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
  		    sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
  		    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
  		    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  		return this.R * c;
  	}
  });

  /*
   * @namespace Projection
   * @projection L.Projection.SphericalMercator
   *
   * Spherical Mercator projection — the most common projection for online maps,
   * used by almost all free and commercial tile providers. Assumes that Earth is
   * a sphere. Used by the `EPSG:3857` CRS.
   */

  var earthRadius = 6378137;

  var SphericalMercator = {

  	R: earthRadius,
  	MAX_LATITUDE: 85.0511287798,

  	project: function (latlng) {
  		var d = Math.PI / 180,
  		    max = this.MAX_LATITUDE,
  		    lat = Math.max(Math.min(max, latlng.lat), -max),
  		    sin = Math.sin(lat * d);

  		return new Point(
  			this.R * latlng.lng * d,
  			this.R * Math.log((1 + sin) / (1 - sin)) / 2);
  	},

  	unproject: function (point) {
  		var d = 180 / Math.PI;

  		return new LatLng(
  			(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
  			point.x * d / this.R);
  	},

  	bounds: (function () {
  		var d = earthRadius * Math.PI;
  		return new Bounds([-d, -d], [d, d]);
  	})()
  };

  /*
   * @class Transformation
   * @aka L.Transformation
   *
   * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
   * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
   * the reverse. Used by Leaflet in its projections code.
   *
   * @example
   *
   * ```js
   * var transformation = L.transformation(2, 5, -1, 10),
   * 	p = L.point(1, 2),
   * 	p2 = transformation.transform(p), //  L.point(7, 8)
   * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
   * ```
   */


  // factory new L.Transformation(a: Number, b: Number, c: Number, d: Number)
  // Creates a `Transformation` object with the given coefficients.
  function Transformation(a, b, c, d) {
  	if (isArray(a)) {
  		// use array properties
  		this._a = a[0];
  		this._b = a[1];
  		this._c = a[2];
  		this._d = a[3];
  		return;
  	}
  	this._a = a;
  	this._b = b;
  	this._c = c;
  	this._d = d;
  }

  Transformation.prototype = {
  	// @method transform(point: Point, scale?: Number): Point
  	// Returns a transformed point, optionally multiplied by the given scale.
  	// Only accepts actual `L.Point` instances, not arrays.
  	transform: function (point, scale) { // (Point, Number) -> Point
  		return this._transform(point.clone(), scale);
  	},

  	// destructive transform (faster)
  	_transform: function (point, scale) {
  		scale = scale || 1;
  		point.x = scale * (this._a * point.x + this._b);
  		point.y = scale * (this._c * point.y + this._d);
  		return point;
  	},

  	// @method untransform(point: Point, scale?: Number): Point
  	// Returns the reverse transformation of the given point, optionally divided
  	// by the given scale. Only accepts actual `L.Point` instances, not arrays.
  	untransform: function (point, scale) {
  		scale = scale || 1;
  		return new Point(
  		        (point.x / scale - this._b) / this._a,
  		        (point.y / scale - this._d) / this._c);
  	}
  };

  // factory L.transformation(a: Number, b: Number, c: Number, d: Number)

  // @factory L.transformation(a: Number, b: Number, c: Number, d: Number)
  // Instantiates a Transformation object with the given coefficients.

  // @alternative
  // @factory L.transformation(coefficients: Array): Transformation
  // Expects an coefficients array of the form
  // `[a: Number, b: Number, c: Number, d: Number]`.

  function toTransformation(a, b, c, d) {
  	return new Transformation(a, b, c, d);
  }

  /*
   * @namespace CRS
   * @crs L.CRS.EPSG3857
   *
   * The most common CRS for online maps, used by almost all free and commercial
   * tile providers. Uses Spherical Mercator projection. Set in by default in
   * Map's `crs` option.
   */

  var EPSG3857 = extend({}, Earth, {
  	code: 'EPSG:3857',
  	projection: SphericalMercator,

  	transformation: (function () {
  		var scale = 0.5 / (Math.PI * SphericalMercator.R);
  		return toTransformation(scale, 0.5, -scale, 0.5);
  	}())
  });

  var EPSG900913 = extend({}, EPSG3857, {
  	code: 'EPSG:900913'
  });

  // @namespace SVG; @section
  // There are several static functions which can be called without instantiating L.SVG:

  // @function create(name: String): SVGElement
  // Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
  // corresponding to the class name passed. For example, using 'line' will return
  // an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
  function svgCreate(name) {
  	return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  // @function pointsToPath(rings: Point[], closed: Boolean): String
  // Generates a SVG path string for multiple rings, with each ring turning
  // into "M..L..L.." instructions
  function pointsToPath(rings, closed) {
  	var str = '',
  	i, j, len, len2, points, p;

  	for (i = 0, len = rings.length; i < len; i++) {
  		points = rings[i];

  		for (j = 0, len2 = points.length; j < len2; j++) {
  			p = points[j];
  			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
  		}

  		// closes the ring for polygons; "x" is VML syntax
  		str += closed ? (svg ? 'z' : 'x') : '';
  	}

  	// SVG complains about empty path strings
  	return str || 'M0 0';
  }

  /*
   * @namespace Browser
   * @aka L.Browser
   *
   * A namespace with static properties for browser/feature detection used by Leaflet internally.
   *
   * @example
   *
   * ```js
   * if (L.Browser.ielt9) {
   *   alert('Upgrade your browser, dude!');
   * }
   * ```
   */

  var style$1 = document.documentElement.style;

  // @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).
  var ie = 'ActiveXObject' in window;

  // @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.
  var ielt9 = ie && !document.addEventListener;

  // @property edge: Boolean; `true` for the Edge web browser.
  var edge = 'msLaunchUri' in navigator && !('documentMode' in document);

  // @property webkit: Boolean;
  // `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
  var webkit = userAgentContains('webkit');

  // @property android: Boolean
  // `true` for any browser running on an Android platform.
  var android = userAgentContains('android');

  // @property android23: Boolean; `true` for browsers running on Android 2 or Android 3.
  var android23 = userAgentContains('android 2') || userAgentContains('android 3');

  /* See https://stackoverflow.com/a/17961266 for details on detecting stock Android */
  var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10); // also matches AppleWebKit
  // @property androidStock: Boolean; `true` for the Android stock browser (i.e. not Chrome)
  var androidStock = android && userAgentContains('Google') && webkitVer < 537 && !('AudioNode' in window);

  // @property opera: Boolean; `true` for the Opera browser
  var opera = !!window.opera;

  // @property chrome: Boolean; `true` for the Chrome browser.
  var chrome = !edge && userAgentContains('chrome');

  // @property gecko: Boolean; `true` for gecko-based browsers like Firefox.
  var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;

  // @property safari: Boolean; `true` for the Safari browser.
  var safari = !chrome && userAgentContains('safari');

  var phantom = userAgentContains('phantom');

  // @property opera12: Boolean
  // `true` for the Opera browser supporting CSS transforms (version 12 or later).
  var opera12 = 'OTransition' in style$1;

  // @property win: Boolean; `true` when the browser is running in a Windows platform
  var win = navigator.platform.indexOf('Win') === 0;

  // @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.
  var ie3d = ie && ('transition' in style$1);

  // @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.
  var webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23;

  // @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.
  var gecko3d = 'MozPerspective' in style$1;

  // @property any3d: Boolean
  // `true` for all browsers supporting CSS transforms.
  var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;

  // @property mobile: Boolean; `true` for all browsers running in a mobile device.
  var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');

  // @property mobileWebkit: Boolean; `true` for all webkit-based browsers in a mobile device.
  var mobileWebkit = mobile && webkit;

  // @property mobileWebkit3d: Boolean
  // `true` for all webkit-based browsers in a mobile device supporting CSS transforms.
  var mobileWebkit3d = mobile && webkit3d;

  // @property msPointer: Boolean
  // `true` for browsers implementing the Microsoft touch events model (notably IE10).
  var msPointer = !window.PointerEvent && window.MSPointerEvent;

  // @property pointer: Boolean
  // `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
  var pointer = !!(window.PointerEvent || msPointer);

  // @property touch: Boolean
  // `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
  // This does not necessarily mean that the browser is running in a computer with
  // a touchscreen, it only means that the browser is capable of understanding
  // touch events.
  var touch = !window.L_NO_TOUCH && (pointer || 'ontouchstart' in window ||
  		(window.DocumentTouch && document instanceof window.DocumentTouch));

  // @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.
  var mobileOpera = mobile && opera;

  // @property mobileGecko: Boolean
  // `true` for gecko-based browsers running in a mobile device.
  var mobileGecko = mobile && gecko;

  // @property retina: Boolean
  // `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.
  var retina = (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;

  // @property passiveEvents: Boolean
  // `true` for browsers that support passive events.
  var passiveEvents = (function () {
  	var supportsPassiveOption = false;
  	try {
  		var opts = Object.defineProperty({}, 'passive', {
  			get: function () { // eslint-disable-line getter-return
  				supportsPassiveOption = true;
  			}
  		});
  		window.addEventListener('testPassiveEventSupport', falseFn, opts);
  		window.removeEventListener('testPassiveEventSupport', falseFn, opts);
  	} catch (e) {
  		// Errors can safely be ignored since this is only a browser support test.
  	}
  	return supportsPassiveOption;
  }());

  // @property canvas: Boolean
  // `true` when the browser supports [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
  var canvas = (function () {
  	return !!document.createElement('canvas').getContext;
  }());

  // @property svg: Boolean
  // `true` when the browser supports [SVG](https://developer.mozilla.org/docs/Web/SVG).
  var svg = !!(document.createElementNS && svgCreate('svg').createSVGRect);

  // @property vml: Boolean
  // `true` if the browser supports [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language).
  var vml = !svg && (function () {
  	try {
  		var div = document.createElement('div');
  		div.innerHTML = '<v:shape adj="1"/>';

  		var shape = div.firstChild;
  		shape.style.behavior = 'url(#default#VML)';

  		return shape && (typeof shape.adj === 'object');

  	} catch (e) {
  		return false;
  	}
  }());


  function userAgentContains(str) {
  	return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
  }

  var Browser = ({
    ie: ie,
    ielt9: ielt9,
    edge: edge,
    webkit: webkit,
    android: android,
    android23: android23,
    androidStock: androidStock,
    opera: opera,
    chrome: chrome,
    gecko: gecko,
    safari: safari,
    phantom: phantom,
    opera12: opera12,
    win: win,
    ie3d: ie3d,
    webkit3d: webkit3d,
    gecko3d: gecko3d,
    any3d: any3d,
    mobile: mobile,
    mobileWebkit: mobileWebkit,
    mobileWebkit3d: mobileWebkit3d,
    msPointer: msPointer,
    pointer: pointer,
    touch: touch,
    mobileOpera: mobileOpera,
    mobileGecko: mobileGecko,
    retina: retina,
    passiveEvents: passiveEvents,
    canvas: canvas,
    svg: svg,
    vml: vml
  });

  /*
   * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
   */


  var POINTER_DOWN =   msPointer ? 'MSPointerDown'   : 'pointerdown';
  var POINTER_MOVE =   msPointer ? 'MSPointerMove'   : 'pointermove';
  var POINTER_UP =     msPointer ? 'MSPointerUp'     : 'pointerup';
  var POINTER_CANCEL = msPointer ? 'MSPointerCancel' : 'pointercancel';

  var _pointers = {};
  var _pointerDocListener = false;

  // Provides a touch events wrapper for (ms)pointer events.
  // ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

  function addPointerListener(obj, type, handler, id) {
  	if (type === 'touchstart') {
  		_addPointerStart(obj, handler, id);

  	} else if (type === 'touchmove') {
  		_addPointerMove(obj, handler, id);

  	} else if (type === 'touchend') {
  		_addPointerEnd(obj, handler, id);
  	}

  	return this;
  }

  function removePointerListener(obj, type, id) {
  	var handler = obj['_leaflet_' + type + id];

  	if (type === 'touchstart') {
  		obj.removeEventListener(POINTER_DOWN, handler, false);

  	} else if (type === 'touchmove') {
  		obj.removeEventListener(POINTER_MOVE, handler, false);

  	} else if (type === 'touchend') {
  		obj.removeEventListener(POINTER_UP, handler, false);
  		obj.removeEventListener(POINTER_CANCEL, handler, false);
  	}

  	return this;
  }

  function _addPointerStart(obj, handler, id) {
  	var onDown = bind(function (e) {
  		// IE10 specific: MsTouch needs preventDefault. See #2000
  		if (e.MSPOINTER_TYPE_TOUCH && e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
  			preventDefault(e);
  		}

  		_handlePointer(e, handler);
  	});

  	obj['_leaflet_touchstart' + id] = onDown;
  	obj.addEventListener(POINTER_DOWN, onDown, false);

  	// need to keep track of what pointers and how many are active to provide e.touches emulation
  	if (!_pointerDocListener) {
  		// we listen document as any drags that end by moving the touch off the screen get fired there
  		document.addEventListener(POINTER_DOWN, _globalPointerDown, true);
  		document.addEventListener(POINTER_MOVE, _globalPointerMove, true);
  		document.addEventListener(POINTER_UP, _globalPointerUp, true);
  		document.addEventListener(POINTER_CANCEL, _globalPointerUp, true);

  		_pointerDocListener = true;
  	}
  }

  function _globalPointerDown(e) {
  	_pointers[e.pointerId] = e;
  }

  function _globalPointerMove(e) {
  	if (_pointers[e.pointerId]) {
  		_pointers[e.pointerId] = e;
  	}
  }

  function _globalPointerUp(e) {
  	delete _pointers[e.pointerId];
  }

  function _handlePointer(e, handler) {
  	e.touches = [];
  	for (var i in _pointers) {
  		e.touches.push(_pointers[i]);
  	}
  	e.changedTouches = [e];

  	handler(e);
  }

  function _addPointerMove(obj, handler, id) {
  	var onMove = function (e) {
  		// don't fire touch moves when mouse isn't down
  		if ((e.pointerType === (e.MSPOINTER_TYPE_MOUSE || 'mouse')) && e.buttons === 0) {
  			return;
  		}

  		_handlePointer(e, handler);
  	};

  	obj['_leaflet_touchmove' + id] = onMove;
  	obj.addEventListener(POINTER_MOVE, onMove, false);
  }

  function _addPointerEnd(obj, handler, id) {
  	var onUp = function (e) {
  		_handlePointer(e, handler);
  	};

  	obj['_leaflet_touchend' + id] = onUp;
  	obj.addEventListener(POINTER_UP, onUp, false);
  	obj.addEventListener(POINTER_CANCEL, onUp, false);
  }

  /*
   * Extends the event handling code with double tap support for mobile browsers.
   */

  var _touchstart = msPointer ? 'MSPointerDown' : pointer ? 'pointerdown' : 'touchstart';
  var _touchend = msPointer ? 'MSPointerUp' : pointer ? 'pointerup' : 'touchend';
  var _pre = '_leaflet_';

  // inspired by Zepto touch code by Thomas Fuchs
  function addDoubleTapListener(obj, handler, id) {
  	var last, touch$$1,
  	    doubleTap = false,
  	    delay = 250;

  	function onTouchStart(e) {

  		if (pointer) {
  			if (!e.isPrimary) { return; }
  			if (e.pointerType === 'mouse') { return; } // mouse fires native dblclick
  		} else if (e.touches.length > 1) {
  			return;
  		}

  		var now = Date.now(),
  		    delta = now - (last || now);

  		touch$$1 = e.touches ? e.touches[0] : e;
  		doubleTap = (delta > 0 && delta <= delay);
  		last = now;
  	}

  	function onTouchEnd(e) {
  		if (doubleTap && !touch$$1.cancelBubble) {
  			if (pointer) {
  				if (e.pointerType === 'mouse') { return; }
  				// work around .type being readonly with MSPointer* events
  				var newTouch = {},
  				    prop, i;

  				for (i in touch$$1) {
  					prop = touch$$1[i];
  					newTouch[i] = prop && prop.bind ? prop.bind(touch$$1) : prop;
  				}
  				touch$$1 = newTouch;
  			}
  			touch$$1.type = 'dblclick';
  			touch$$1.button = 0;
  			handler(touch$$1);
  			last = null;
  		}
  	}

  	obj[_pre + _touchstart + id] = onTouchStart;
  	obj[_pre + _touchend + id] = onTouchEnd;
  	obj[_pre + 'dblclick' + id] = handler;

  	obj.addEventListener(_touchstart, onTouchStart, passiveEvents ? {passive: false} : false);
  	obj.addEventListener(_touchend, onTouchEnd, passiveEvents ? {passive: false} : false);

  	// On some platforms (notably, chrome<55 on win10 + touchscreen + mouse),
  	// the browser doesn't fire touchend/pointerup events but does fire
  	// native dblclicks. See #4127.
  	// Edge 14 also fires native dblclicks, but only for pointerType mouse, see #5180.
  	obj.addEventListener('dblclick', handler, false);

  	return this;
  }

  function removeDoubleTapListener(obj, id) {
  	var touchstart = obj[_pre + _touchstart + id],
  	    touchend = obj[_pre + _touchend + id],
  	    dblclick = obj[_pre + 'dblclick' + id];

  	obj.removeEventListener(_touchstart, touchstart, passiveEvents ? {passive: false} : false);
  	obj.removeEventListener(_touchend, touchend, passiveEvents ? {passive: false} : false);
  	obj.removeEventListener('dblclick', dblclick, false);

  	return this;
  }

  /*
   * @namespace DomUtil
   *
   * Utility functions to work with the [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
   * tree, used by Leaflet internally.
   *
   * Most functions expecting or returning a `HTMLElement` also work for
   * SVG elements. The only difference is that classes refer to CSS classes
   * in HTML and SVG classes in SVG.
   */


  // @property TRANSFORM: String
  // Vendor-prefixed transform style name (e.g. `'webkitTransform'` for WebKit).
  var TRANSFORM = testProp(
  	['transform', 'webkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

  // webkitTransition comes first because some browser versions that drop vendor prefix don't do
  // the same for the transitionend event, in particular the Android 4.1 stock browser

  // @property TRANSITION: String
  // Vendor-prefixed transition style name.
  var TRANSITION = testProp(
  	['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

  // @property TRANSITION_END: String
  // Vendor-prefixed transitionend event name.
  var TRANSITION_END =
  	TRANSITION === 'webkitTransition' || TRANSITION === 'OTransition' ? TRANSITION + 'End' : 'transitionend';


  // @function get(id: String|HTMLElement): HTMLElement
  // Returns an element given its DOM id, or returns the element itself
  // if it was passed directly.
  function get(id) {
  	return typeof id === 'string' ? document.getElementById(id) : id;
  }

  // @function getStyle(el: HTMLElement, styleAttrib: String): String
  // Returns the value for a certain style attribute on an element,
  // including computed values or values set through CSS.
  function getStyle(el, style) {
  	var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

  	if ((!value || value === 'auto') && document.defaultView) {
  		var css = document.defaultView.getComputedStyle(el, null);
  		value = css ? css[style] : null;
  	}
  	return value === 'auto' ? null : value;
  }

  // @function create(tagName: String, className?: String, container?: HTMLElement): HTMLElement
  // Creates an HTML element with `tagName`, sets its class to `className`, and optionally appends it to `container` element.
  function create$1(tagName, className, container) {
  	var el = document.createElement(tagName);
  	el.className = className || '';

  	if (container) {
  		container.appendChild(el);
  	}
  	return el;
  }

  // @function remove(el: HTMLElement)
  // Removes `el` from its parent element
  function remove(el) {
  	var parent = el.parentNode;
  	if (parent) {
  		parent.removeChild(el);
  	}
  }

  // @function empty(el: HTMLElement)
  // Removes all of `el`'s children elements from `el`
  function empty(el) {
  	while (el.firstChild) {
  		el.removeChild(el.firstChild);
  	}
  }

  // @function toFront(el: HTMLElement)
  // Makes `el` the last child of its parent, so it renders in front of the other children.
  function toFront(el) {
  	var parent = el.parentNode;
  	if (parent && parent.lastChild !== el) {
  		parent.appendChild(el);
  	}
  }

  // @function toBack(el: HTMLElement)
  // Makes `el` the first child of its parent, so it renders behind the other children.
  function toBack(el) {
  	var parent = el.parentNode;
  	if (parent && parent.firstChild !== el) {
  		parent.insertBefore(el, parent.firstChild);
  	}
  }

  // @function hasClass(el: HTMLElement, name: String): Boolean
  // Returns `true` if the element's class attribute contains `name`.
  function hasClass(el, name) {
  	if (el.classList !== undefined) {
  		return el.classList.contains(name);
  	}
  	var className = getClass(el);
  	return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
  }

  // @function addClass(el: HTMLElement, name: String)
  // Adds `name` to the element's class attribute.
  function addClass(el, name) {
  	if (el.classList !== undefined) {
  		var classes = splitWords(name);
  		for (var i = 0, len = classes.length; i < len; i++) {
  			el.classList.add(classes[i]);
  		}
  	} else if (!hasClass(el, name)) {
  		var className = getClass(el);
  		setClass(el, (className ? className + ' ' : '') + name);
  	}
  }

  // @function removeClass(el: HTMLElement, name: String)
  // Removes `name` from the element's class attribute.
  function removeClass(el, name) {
  	if (el.classList !== undefined) {
  		el.classList.remove(name);
  	} else {
  		setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
  	}
  }

  // @function setClass(el: HTMLElement, name: String)
  // Sets the element's class.
  function setClass(el, name) {
  	if (el.className.baseVal === undefined) {
  		el.className = name;
  	} else {
  		// in case of SVG element
  		el.className.baseVal = name;
  	}
  }

  // @function getClass(el: HTMLElement): String
  // Returns the element's class.
  function getClass(el) {
  	// Check if the element is an SVGElementInstance and use the correspondingElement instead
  	// (Required for linked SVG elements in IE11.)
  	if (el.correspondingElement) {
  		el = el.correspondingElement;
  	}
  	return el.className.baseVal === undefined ? el.className : el.className.baseVal;
  }

  // @function setOpacity(el: HTMLElement, opacity: Number)
  // Set the opacity of an element (including old IE support).
  // `opacity` must be a number from `0` to `1`.
  function setOpacity(el, value) {
  	if ('opacity' in el.style) {
  		el.style.opacity = value;
  	} else if ('filter' in el.style) {
  		_setOpacityIE(el, value);
  	}
  }

  function _setOpacityIE(el, value) {
  	var filter = false,
  	    filterName = 'DXImageTransform.Microsoft.Alpha';

  	// filters collection throws an error if we try to retrieve a filter that doesn't exist
  	try {
  		filter = el.filters.item(filterName);
  	} catch (e) {
  		// don't set opacity to 1 if we haven't already set an opacity,
  		// it isn't needed and breaks transparent pngs.
  		if (value === 1) { return; }
  	}

  	value = Math.round(value * 100);

  	if (filter) {
  		filter.Enabled = (value !== 100);
  		filter.Opacity = value;
  	} else {
  		el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
  	}
  }

  // @function testProp(props: String[]): String|false
  // Goes through the array of style names and returns the first name
  // that is a valid style name for an element. If no such name is found,
  // it returns false. Useful for vendor-prefixed styles like `transform`.
  function testProp(props) {
  	var style = document.documentElement.style;

  	for (var i = 0; i < props.length; i++) {
  		if (props[i] in style) {
  			return props[i];
  		}
  	}
  	return false;
  }

  // @function setTransform(el: HTMLElement, offset: Point, scale?: Number)
  // Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
  // and optionally scaled by `scale`. Does not have an effect if the
  // browser doesn't support 3D CSS transforms.
  function setTransform(el, offset, scale) {
  	var pos = offset || new Point(0, 0);

  	el.style[TRANSFORM] =
  		(ie3d ?
  			'translate(' + pos.x + 'px,' + pos.y + 'px)' :
  			'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
  		(scale ? ' scale(' + scale + ')' : '');
  }

  // @function setPosition(el: HTMLElement, position: Point)
  // Sets the position of `el` to coordinates specified by `position`,
  // using CSS translate or top/left positioning depending on the browser
  // (used by Leaflet internally to position its layers).
  function setPosition(el, point) {

  	/*eslint-disable */
  	el._leaflet_pos = point;
  	/* eslint-enable */

  	if (any3d) {
  		setTransform(el, point);
  	} else {
  		el.style.left = point.x + 'px';
  		el.style.top = point.y + 'px';
  	}
  }

  // @function getPosition(el: HTMLElement): Point
  // Returns the coordinates of an element previously positioned with setPosition.
  function getPosition(el) {
  	// this method is only used for elements previously positioned using setPosition,
  	// so it's safe to cache the position for performance

  	return el._leaflet_pos || new Point(0, 0);
  }

  // @function disableTextSelection()
  // Prevents the user from generating `selectstart` DOM events, usually generated
  // when the user drags the mouse through a page with text. Used internally
  // by Leaflet to override the behaviour of any click-and-drag interaction on
  // the map. Affects drag interactions on the whole document.

  // @function enableTextSelection()
  // Cancels the effects of a previous [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection).
  var disableTextSelection;
  var enableTextSelection;
  var _userSelect;
  if ('onselectstart' in document) {
  	disableTextSelection = function () {
  		on(window, 'selectstart', preventDefault);
  	};
  	enableTextSelection = function () {
  		off(window, 'selectstart', preventDefault);
  	};
  } else {
  	var userSelectProperty = testProp(
  		['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

  	disableTextSelection = function () {
  		if (userSelectProperty) {
  			var style = document.documentElement.style;
  			_userSelect = style[userSelectProperty];
  			style[userSelectProperty] = 'none';
  		}
  	};
  	enableTextSelection = function () {
  		if (userSelectProperty) {
  			document.documentElement.style[userSelectProperty] = _userSelect;
  			_userSelect = undefined;
  		}
  	};
  }

  // @function disableImageDrag()
  // As [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection), but
  // for `dragstart` DOM events, usually generated when the user drags an image.
  function disableImageDrag() {
  	on(window, 'dragstart', preventDefault);
  }

  // @function enableImageDrag()
  // Cancels the effects of a previous [`L.DomUtil.disableImageDrag`](#domutil-disabletextselection).
  function enableImageDrag() {
  	off(window, 'dragstart', preventDefault);
  }

  var _outlineElement, _outlineStyle;
  // @function preventOutline(el: HTMLElement)
  // Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
  // of the element `el` invisible. Used internally by Leaflet to prevent
  // focusable elements from displaying an outline when the user performs a
  // drag interaction on them.
  function preventOutline(element) {
  	while (element.tabIndex === -1) {
  		element = element.parentNode;
  	}
  	if (!element.style) { return; }
  	restoreOutline();
  	_outlineElement = element;
  	_outlineStyle = element.style.outline;
  	element.style.outline = 'none';
  	on(window, 'keydown', restoreOutline);
  }

  // @function restoreOutline()
  // Cancels the effects of a previous [`L.DomUtil.preventOutline`]().
  function restoreOutline() {
  	if (!_outlineElement) { return; }
  	_outlineElement.style.outline = _outlineStyle;
  	_outlineElement = undefined;
  	_outlineStyle = undefined;
  	off(window, 'keydown', restoreOutline);
  }

  // @function getSizedParentNode(el: HTMLElement): HTMLElement
  // Finds the closest parent node which size (width and height) is not null.
  function getSizedParentNode(element) {
  	do {
  		element = element.parentNode;
  	} while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
  	return element;
  }

  // @function getScale(el: HTMLElement): Object
  // Computes the CSS scale currently applied on the element.
  // Returns an object with `x` and `y` members as horizontal and vertical scales respectively,
  // and `boundingClientRect` as the result of [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
  function getScale(element) {
  	var rect = element.getBoundingClientRect(); // Read-only in old browsers.

  	return {
  		x: rect.width / element.offsetWidth || 1,
  		y: rect.height / element.offsetHeight || 1,
  		boundingClientRect: rect
  	};
  }

  var DomUtil = ({
    TRANSFORM: TRANSFORM,
    TRANSITION: TRANSITION,
    TRANSITION_END: TRANSITION_END,
    get: get,
    getStyle: getStyle,
    create: create$1,
    remove: remove,
    empty: empty,
    toFront: toFront,
    toBack: toBack,
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    setClass: setClass,
    getClass: getClass,
    setOpacity: setOpacity,
    testProp: testProp,
    setTransform: setTransform,
    setPosition: setPosition,
    getPosition: getPosition,
    disableTextSelection: disableTextSelection,
    enableTextSelection: enableTextSelection,
    disableImageDrag: disableImageDrag,
    enableImageDrag: enableImageDrag,
    preventOutline: preventOutline,
    restoreOutline: restoreOutline,
    getSizedParentNode: getSizedParentNode,
    getScale: getScale
  });

  /*
   * @namespace DomEvent
   * Utility functions to work with the [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Leaflet internally.
   */

  // Inspired by John Resig, Dean Edwards and YUI addEvent implementations.

  // @function on(el: HTMLElement, types: String, fn: Function, context?: Object): this
  // Adds a listener function (`fn`) to a particular DOM event type of the
  // element `el`. You can optionally specify the context of the listener
  // (object the `this` keyword will point to). You can also pass several
  // space-separated types (e.g. `'click dblclick'`).

  // @alternative
  // @function on(el: HTMLElement, eventMap: Object, context?: Object): this
  // Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
  function on(obj, types, fn, context) {

  	if (typeof types === 'object') {
  		for (var type in types) {
  			addOne(obj, type, types[type], fn);
  		}
  	} else {
  		types = splitWords(types);

  		for (var i = 0, len = types.length; i < len; i++) {
  			addOne(obj, types[i], fn, context);
  		}
  	}

  	return this;
  }

  var eventsKey = '_leaflet_events';

  // @function off(el: HTMLElement, types: String, fn: Function, context?: Object): this
  // Removes a previously added listener function.
  // Note that if you passed a custom context to on, you must pass the same
  // context to `off` in order to remove the listener.

  // @alternative
  // @function off(el: HTMLElement, eventMap: Object, context?: Object): this
  // Removes a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
  function off(obj, types, fn, context) {

  	if (typeof types === 'object') {
  		for (var type in types) {
  			removeOne(obj, type, types[type], fn);
  		}
  	} else if (types) {
  		types = splitWords(types);

  		for (var i = 0, len = types.length; i < len; i++) {
  			removeOne(obj, types[i], fn, context);
  		}
  	} else {
  		for (var j in obj[eventsKey]) {
  			removeOne(obj, j, obj[eventsKey][j]);
  		}
  		delete obj[eventsKey];
  	}

  	return this;
  }

  function browserFiresNativeDblClick() {
  	// See https://github.com/w3c/pointerevents/issues/171
  	if (pointer) {
  		return !(edge || safari);
  	}
  }

  var mouseSubst = {
  	mouseenter: 'mouseover',
  	mouseleave: 'mouseout',
  	wheel: !('onwheel' in window) && 'mousewheel'
  };

  function addOne(obj, type, fn, context) {
  	var id = type + stamp(fn) + (context ? '_' + stamp(context) : '');

  	if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

  	var handler = function (e) {
  		return fn.call(context || obj, e || window.event);
  	};

  	var originalHandler = handler;

  	if (pointer && type.indexOf('touch') === 0) {
  		// Needs DomEvent.Pointer.js
  		addPointerListener(obj, type, handler, id);

  	} else if (touch && (type === 'dblclick') && !browserFiresNativeDblClick()) {
  		addDoubleTapListener(obj, handler, id);

  	} else if ('addEventListener' in obj) {

  		if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' ||  type === 'mousewheel') {
  			obj.addEventListener(mouseSubst[type] || type, handler, passiveEvents ? {passive: false} : false);

  		} else if (type === 'mouseenter' || type === 'mouseleave') {
  			handler = function (e) {
  				e = e || window.event;
  				if (isExternalTarget(obj, e)) {
  					originalHandler(e);
  				}
  			};
  			obj.addEventListener(mouseSubst[type], handler, false);

  		} else {
  			obj.addEventListener(type, originalHandler, false);
  		}

  	} else if ('attachEvent' in obj) {
  		obj.attachEvent('on' + type, handler);
  	}

  	obj[eventsKey] = obj[eventsKey] || {};
  	obj[eventsKey][id] = handler;
  }

  function removeOne(obj, type, fn, context) {

  	var id = type + stamp(fn) + (context ? '_' + stamp(context) : ''),
  	    handler = obj[eventsKey] && obj[eventsKey][id];

  	if (!handler) { return this; }

  	if (pointer && type.indexOf('touch') === 0) {
  		removePointerListener(obj, type, id);

  	} else if (touch && (type === 'dblclick') && !browserFiresNativeDblClick()) {
  		removeDoubleTapListener(obj, id);

  	} else if ('removeEventListener' in obj) {

  		obj.removeEventListener(mouseSubst[type] || type, handler, false);

  	} else if ('detachEvent' in obj) {
  		obj.detachEvent('on' + type, handler);
  	}

  	obj[eventsKey][id] = null;
  }

  // @function stopPropagation(ev: DOMEvent): this
  // Stop the given event from propagation to parent elements. Used inside the listener functions:
  // ```js
  // L.DomEvent.on(div, 'click', function (ev) {
  // 	L.DomEvent.stopPropagation(ev);
  // });
  // ```
  function stopPropagation(e) {

  	if (e.stopPropagation) {
  		e.stopPropagation();
  	} else if (e.originalEvent) {  // In case of Leaflet event.
  		e.originalEvent._stopped = true;
  	} else {
  		e.cancelBubble = true;
  	}
  	skipped(e);

  	return this;
  }

  // @function disableScrollPropagation(el: HTMLElement): this
  // Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
  function disableScrollPropagation(el) {
  	addOne(el, 'wheel', stopPropagation);
  	return this;
  }

  // @function disableClickPropagation(el: HTMLElement): this
  // Adds `stopPropagation` to the element's `'click'`, `'doubleclick'`,
  // `'mousedown'` and `'touchstart'` events (plus browser variants).
  function disableClickPropagation(el) {
  	on(el, 'mousedown touchstart dblclick', stopPropagation);
  	addOne(el, 'click', fakeStop);
  	return this;
  }

  // @function preventDefault(ev: DOMEvent): this
  // Prevents the default action of the DOM Event `ev` from happening (such as
  // following a link in the href of the a element, or doing a POST request
  // with page reload when a `<form>` is submitted).
  // Use it inside listener functions.
  function preventDefault(e) {
  	if (e.preventDefault) {
  		e.preventDefault();
  	} else {
  		e.returnValue = false;
  	}
  	return this;
  }

  // @function stop(ev: DOMEvent): this
  // Does `stopPropagation` and `preventDefault` at the same time.
  function stop(e) {
  	preventDefault(e);
  	stopPropagation(e);
  	return this;
  }

  // @function getMousePosition(ev: DOMEvent, container?: HTMLElement): Point
  // Gets normalized mouse position from a DOM event relative to the
  // `container` (border excluded) or to the whole page if not specified.
  function getMousePosition(e, container) {
  	if (!container) {
  		return new Point(e.clientX, e.clientY);
  	}

  	var scale = getScale(container),
  	    offset = scale.boundingClientRect; // left and top  values are in page scale (like the event clientX/Y)

  	return new Point(
  		// offset.left/top values are in page scale (like clientX/Y),
  		// whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
  		(e.clientX - offset.left) / scale.x - container.clientLeft,
  		(e.clientY - offset.top) / scale.y - container.clientTop
  	);
  }

  // Chrome on Win scrolls double the pixels as in other platforms (see #4538),
  // and Firefox scrolls device pixels, not CSS pixels
  var wheelPxFactor =
  	(win && chrome) ? 2 * window.devicePixelRatio :
  	gecko ? window.devicePixelRatio : 1;

  // @function getWheelDelta(ev: DOMEvent): Number
  // Gets normalized wheel delta from a wheel DOM event, in vertical
  // pixels scrolled (negative if scrolling down).
  // Events from pointing devices without precise scrolling are mapped to
  // a best guess of 60 pixels.
  function getWheelDelta(e) {
  	return (edge) ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
  	       (e.deltaY && e.deltaMode === 0) ? -e.deltaY / wheelPxFactor : // Pixels
  	       (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
  	       (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
  	       (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
  	       e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
  	       (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
  	       e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
  	       0;
  }

  var skipEvents = {};

  function fakeStop(e) {
  	// fakes stopPropagation by setting a special event flag, checked/reset with skipped(e)
  	skipEvents[e.type] = true;
  }

  function skipped(e) {
  	var events = skipEvents[e.type];
  	// reset when checking, as it's only used in map container and propagates outside of the map
  	skipEvents[e.type] = false;
  	return events;
  }

  // check if element really left/entered the event target (for mouseenter/mouseleave)
  function isExternalTarget(el, e) {

  	var related = e.relatedTarget;

  	if (!related) { return true; }

  	try {
  		while (related && (related !== el)) {
  			related = related.parentNode;
  		}
  	} catch (err) {
  		return false;
  	}
  	return (related !== el);
  }

  var DomEvent = ({
    on: on,
    off: off,
    stopPropagation: stopPropagation,
    disableScrollPropagation: disableScrollPropagation,
    disableClickPropagation: disableClickPropagation,
    preventDefault: preventDefault,
    stop: stop,
    getMousePosition: getMousePosition,
    getWheelDelta: getWheelDelta,
    fakeStop: fakeStop,
    skipped: skipped,
    isExternalTarget: isExternalTarget,
    addListener: on,
    removeListener: off
  });

  /*
   * @class PosAnimation
   * @aka L.PosAnimation
   * @inherits Evented
   * Used internally for panning animations, utilizing CSS3 Transitions for modern browsers and a timer fallback for IE6-9.
   *
   * @example
   * ```js
   * var fx = new L.PosAnimation();
   * fx.run(el, [300, 500], 0.5);
   * ```
   *
   * @constructor L.PosAnimation()
   * Creates a `PosAnimation` object.
   *
   */

  var PosAnimation = Evented.extend({

  	// @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
  	// Run an animation of a given element to a new position, optionally setting
  	// duration in seconds (`0.25` by default) and easing linearity factor (3rd
  	// argument of the [cubic bezier curve](http://cubic-bezier.com/#0,0,.5,1),
  	// `0.5` by default).
  	run: function (el, newPos, duration, easeLinearity) {
  		this.stop();

  		this._el = el;
  		this._inProgress = true;
  		this._duration = duration || 0.25;
  		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

  		this._startPos = getPosition(el);
  		this._offset = newPos.subtract(this._startPos);
  		this._startTime = +new Date();

  		// @event start: Event
  		// Fired when the animation starts
  		this.fire('start');

  		this._animate();
  	},

  	// @method stop()
  	// Stops the animation (if currently running).
  	stop: function () {
  		if (!this._inProgress) { return; }

  		this._step(true);
  		this._complete();
  	},

  	_animate: function () {
  		// animation loop
  		this._animId = requestAnimFrame(this._animate, this);
  		this._step();
  	},

  	_step: function (round) {
  		var elapsed = (+new Date()) - this._startTime,
  		    duration = this._duration * 1000;

  		if (elapsed < duration) {
  			this._runFrame(this._easeOut(elapsed / duration), round);
  		} else {
  			this._runFrame(1);
  			this._complete();
  		}
  	},

  	_runFrame: function (progress, round) {
  		var pos = this._startPos.add(this._offset.multiplyBy(progress));
  		if (round) {
  			pos._round();
  		}
  		setPosition(this._el, pos);

  		// @event step: Event
  		// Fired continuously during the animation.
  		this.fire('step');
  	},

  	_complete: function () {
  		cancelAnimFrame(this._animId);

  		this._inProgress = false;
  		// @event end: Event
  		// Fired when the animation ends.
  		this.fire('end');
  	},

  	_easeOut: function (t) {
  		return 1 - Math.pow(1 - t, this._easeOutPower);
  	}
  });

  /*
   * @class Map
   * @aka L.Map
   * @inherits Evented
   *
   * The central class of the API — it is used to create a map on a page and manipulate it.
   *
   * @example
   *
   * ```js
   * // initialize the map on the "map" div with a given center and zoom
   * var map = L.map('map', {
   * 	center: [51.505, -0.09],
   * 	zoom: 13
   * });
   * ```
   *
   */

  var Map = Evented.extend({

  	options: {
  		// @section Map State Options
  		// @option crs: CRS = L.CRS.EPSG3857
  		// The [Coordinate Reference System](#crs) to use. Don't change this if you're not
  		// sure what it means.
  		crs: EPSG3857,

  		// @option center: LatLng = undefined
  		// Initial geographic center of the map
  		center: undefined,

  		// @option zoom: Number = undefined
  		// Initial map zoom level
  		zoom: undefined,

  		// @option minZoom: Number = *
  		// Minimum zoom level of the map.
  		// If not specified and at least one `GridLayer` or `TileLayer` is in the map,
  		// the lowest of their `minZoom` options will be used instead.
  		minZoom: undefined,

  		// @option maxZoom: Number = *
  		// Maximum zoom level of the map.
  		// If not specified and at least one `GridLayer` or `TileLayer` is in the map,
  		// the highest of their `maxZoom` options will be used instead.
  		maxZoom: undefined,

  		// @option layers: Layer[] = []
  		// Array of layers that will be added to the map initially
  		layers: [],

  		// @option maxBounds: LatLngBounds = null
  		// When this option is set, the map restricts the view to the given
  		// geographical bounds, bouncing the user back if the user tries to pan
  		// outside the view. To set the restriction dynamically, use
  		// [`setMaxBounds`](#map-setmaxbounds) method.
  		maxBounds: undefined,

  		// @option renderer: Renderer = *
  		// The default method for drawing vector layers on the map. `L.SVG`
  		// or `L.Canvas` by default depending on browser support.
  		renderer: undefined,


  		// @section Animation Options
  		// @option zoomAnimation: Boolean = true
  		// Whether the map zoom animation is enabled. By default it's enabled
  		// in all browsers that support CSS3 Transitions except Android.
  		zoomAnimation: true,

  		// @option zoomAnimationThreshold: Number = 4
  		// Won't animate zoom if the zoom difference exceeds this value.
  		zoomAnimationThreshold: 4,

  		// @option fadeAnimation: Boolean = true
  		// Whether the tile fade animation is enabled. By default it's enabled
  		// in all browsers that support CSS3 Transitions except Android.
  		fadeAnimation: true,

  		// @option markerZoomAnimation: Boolean = true
  		// Whether markers animate their zoom with the zoom animation, if disabled
  		// they will disappear for the length of the animation. By default it's
  		// enabled in all browsers that support CSS3 Transitions except Android.
  		markerZoomAnimation: true,

  		// @option transform3DLimit: Number = 2^23
  		// Defines the maximum size of a CSS translation transform. The default
  		// value should not be changed unless a web browser positions layers in
  		// the wrong place after doing a large `panBy`.
  		transform3DLimit: 8388608, // Precision limit of a 32-bit float

  		// @section Interaction Options
  		// @option zoomSnap: Number = 1
  		// Forces the map's zoom level to always be a multiple of this, particularly
  		// right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
  		// By default, the zoom level snaps to the nearest integer; lower values
  		// (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
  		// means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
  		zoomSnap: 1,

  		// @option zoomDelta: Number = 1
  		// Controls how much the map's zoom level will change after a
  		// [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
  		// or `-` on the keyboard, or using the [zoom controls](#control-zoom).
  		// Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
  		zoomDelta: 1,

  		// @option trackResize: Boolean = true
  		// Whether the map automatically handles browser window resize to update itself.
  		trackResize: true
  	},

  	initialize: function (id, options) { // (HTMLElement or String, Object)
  		options = setOptions(this, options);

  		// Make sure to assign internal flags at the beginning,
  		// to avoid inconsistent state in some edge cases.
  		this._handlers = [];
  		this._layers = {};
  		this._zoomBoundLayers = {};
  		this._sizeChanged = true;

  		this._initContainer(id);
  		this._initLayout();

  		// hack for https://github.com/Leaflet/Leaflet/issues/1980
  		this._onResize = bind(this._onResize, this);

  		this._initEvents();

  		if (options.maxBounds) {
  			this.setMaxBounds(options.maxBounds);
  		}

  		if (options.zoom !== undefined) {
  			this._zoom = this._limitZoom(options.zoom);
  		}

  		if (options.center && options.zoom !== undefined) {
  			this.setView(toLatLng(options.center), options.zoom, {reset: true});
  		}

  		this.callInitHooks();

  		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
  		this._zoomAnimated = TRANSITION && any3d && !mobileOpera &&
  				this.options.zoomAnimation;

  		// zoom transitions run with the same duration for all layers, so if one of transitionend events
  		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
  		if (this._zoomAnimated) {
  			this._createAnimProxy();
  			on(this._proxy, TRANSITION_END, this._catchTransitionEnd, this);
  		}

  		this._addLayers(this.options.layers);
  	},


  	// @section Methods for modifying map state

  	// @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
  	// Sets the view of the map (geographical center and zoom) with the given
  	// animation options.
  	setView: function (center, zoom, options) {

  		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
  		center = this._limitCenter(toLatLng(center), zoom, this.options.maxBounds);
  		options = options || {};

  		this._stop();

  		if (this._loaded && !options.reset && options !== true) {

  			if (options.animate !== undefined) {
  				options.zoom = extend({animate: options.animate}, options.zoom);
  				options.pan = extend({animate: options.animate, duration: options.duration}, options.pan);
  			}

  			// try animating pan or zoom
  			var moved = (this._zoom !== zoom) ?
  				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
  				this._tryAnimatedPan(center, options.pan);

  			if (moved) {
  				// prevent resize handler call, the view will refresh after animation anyway
  				clearTimeout(this._sizeTimer);
  				return this;
  			}
  		}

  		// animation didn't start, just reset the map view
  		this._resetView(center, zoom);

  		return this;
  	},

  	// @method setZoom(zoom: Number, options?: Zoom/pan options): this
  	// Sets the zoom of the map.
  	setZoom: function (zoom, options) {
  		if (!this._loaded) {
  			this._zoom = zoom;
  			return this;
  		}
  		return this.setView(this.getCenter(), zoom, {zoom: options});
  	},

  	// @method zoomIn(delta?: Number, options?: Zoom options): this
  	// Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
  	zoomIn: function (delta, options) {
  		delta = delta || (any3d ? this.options.zoomDelta : 1);
  		return this.setZoom(this._zoom + delta, options);
  	},

  	// @method zoomOut(delta?: Number, options?: Zoom options): this
  	// Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
  	zoomOut: function (delta, options) {
  		delta = delta || (any3d ? this.options.zoomDelta : 1);
  		return this.setZoom(this._zoom - delta, options);
  	},

  	// @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
  	// Zooms the map while keeping a specified geographical point on the map
  	// stationary (e.g. used internally for scroll zoom and double-click zoom).
  	// @alternative
  	// @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
  	// Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
  	setZoomAround: function (latlng, zoom, options) {
  		var scale = this.getZoomScale(zoom),
  		    viewHalf = this.getSize().divideBy(2),
  		    containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),

  		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
  		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

  		return this.setView(newCenter, zoom, {zoom: options});
  	},

  	_getBoundsCenterZoom: function (bounds, options) {

  		options = options || {};
  		bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);

  		var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
  		    paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),

  		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

  		zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;

  		if (zoom === Infinity) {
  			return {
  				center: bounds.getCenter(),
  				zoom: zoom
  			};
  		}

  		var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

  		    swPoint = this.project(bounds.getSouthWest(), zoom),
  		    nePoint = this.project(bounds.getNorthEast(), zoom),
  		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

  		return {
  			center: center,
  			zoom: zoom
  		};
  	},

  	// @method fitBounds(bounds: LatLngBounds, options?: fitBounds options): this
  	// Sets a map view that contains the given geographical bounds with the
  	// maximum zoom level possible.
  	fitBounds: function (bounds, options) {

  		bounds = toLatLngBounds(bounds);

  		if (!bounds.isValid()) {
  			throw new Error('Bounds are not valid.');
  		}

  		var target = this._getBoundsCenterZoom(bounds, options);
  		return this.setView(target.center, target.zoom, options);
  	},

  	// @method fitWorld(options?: fitBounds options): this
  	// Sets a map view that mostly contains the whole world with the maximum
  	// zoom level possible.
  	fitWorld: function (options) {
  		return this.fitBounds([[-90, -180], [90, 180]], options);
  	},

  	// @method panTo(latlng: LatLng, options?: Pan options): this
  	// Pans the map to a given center.
  	panTo: function (center, options) { // (LatLng)
  		return this.setView(center, this._zoom, {pan: options});
  	},

  	// @method panBy(offset: Point, options?: Pan options): this
  	// Pans the map by a given number of pixels (animated).
  	panBy: function (offset, options) {
  		offset = toPoint(offset).round();
  		options = options || {};

  		if (!offset.x && !offset.y) {
  			return this.fire('moveend');
  		}
  		// If we pan too far, Chrome gets issues with tiles
  		// and makes them disappear or appear in the wrong place (slightly offset) #2602
  		if (options.animate !== true && !this.getSize().contains(offset)) {
  			this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
  			return this;
  		}

  		if (!this._panAnim) {
  			this._panAnim = new PosAnimation();

  			this._panAnim.on({
  				'step': this._onPanTransitionStep,
  				'end': this._onPanTransitionEnd
  			}, this);
  		}

  		// don't fire movestart if animating inertia
  		if (!options.noMoveStart) {
  			this.fire('movestart');
  		}

  		// animate pan unless animate: false specified
  		if (options.animate !== false) {
  			addClass(this._mapPane, 'leaflet-pan-anim');

  			var newPos = this._getMapPanePos().subtract(offset).round();
  			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
  		} else {
  			this._rawPanBy(offset);
  			this.fire('move').fire('moveend');
  		}

  		return this;
  	},

  	// @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
  	// Sets the view of the map (geographical center and zoom) performing a smooth
  	// pan-zoom animation.
  	flyTo: function (targetCenter, targetZoom, options) {

  		options = options || {};
  		if (options.animate === false || !any3d) {
  			return this.setView(targetCenter, targetZoom, options);
  		}

  		this._stop();

  		var from = this.project(this.getCenter()),
  		    to = this.project(targetCenter),
  		    size = this.getSize(),
  		    startZoom = this._zoom;

  		targetCenter = toLatLng(targetCenter);
  		targetZoom = targetZoom === undefined ? startZoom : targetZoom;

  		var w0 = Math.max(size.x, size.y),
  		    w1 = w0 * this.getZoomScale(startZoom, targetZoom),
  		    u1 = (to.distanceTo(from)) || 1,
  		    rho = 1.42,
  		    rho2 = rho * rho;

  		function r(i) {
  			var s1 = i ? -1 : 1,
  			    s2 = i ? w1 : w0,
  			    t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
  			    b1 = 2 * s2 * rho2 * u1,
  			    b = t1 / b1,
  			    sq = Math.sqrt(b * b + 1) - b;

  			    // workaround for floating point precision bug when sq = 0, log = -Infinite,
  			    // thus triggering an infinite loop in flyTo
  			    var log = sq < 0.000000001 ? -18 : Math.log(sq);

  			return log;
  		}

  		function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
  		function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
  		function tanh(n) { return sinh(n) / cosh(n); }

  		var r0 = r(0);

  		function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
  		function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }

  		function easeOut(t) { return 1 - Math.pow(1 - t, 1.5); }

  		var start = Date.now(),
  		    S = (r(1) - r0) / rho,
  		    duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

  		function frame() {
  			var t = (Date.now() - start) / duration,
  			    s = easeOut(t) * S;

  			if (t <= 1) {
  				this._flyToFrame = requestAnimFrame(frame, this);

  				this._move(
  					this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
  					this.getScaleZoom(w0 / w(s), startZoom),
  					{flyTo: true});

  			} else {
  				this
  					._move(targetCenter, targetZoom)
  					._moveEnd(true);
  			}
  		}

  		this._moveStart(true, options.noMoveStart);

  		frame.call(this);
  		return this;
  	},

  	// @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
  	// Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
  	// but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
  	flyToBounds: function (bounds, options) {
  		var target = this._getBoundsCenterZoom(bounds, options);
  		return this.flyTo(target.center, target.zoom, options);
  	},

  	// @method setMaxBounds(bounds: LatLngBounds): this
  	// Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
  	setMaxBounds: function (bounds) {
  		bounds = toLatLngBounds(bounds);

  		if (!bounds.isValid()) {
  			this.options.maxBounds = null;
  			return this.off('moveend', this._panInsideMaxBounds);
  		} else if (this.options.maxBounds) {
  			this.off('moveend', this._panInsideMaxBounds);
  		}

  		this.options.maxBounds = bounds;

  		if (this._loaded) {
  			this._panInsideMaxBounds();
  		}

  		return this.on('moveend', this._panInsideMaxBounds);
  	},

  	// @method setMinZoom(zoom: Number): this
  	// Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
  	setMinZoom: function (zoom) {
  		var oldZoom = this.options.minZoom;
  		this.options.minZoom = zoom;

  		if (this._loaded && oldZoom !== zoom) {
  			this.fire('zoomlevelschange');

  			if (this.getZoom() < this.options.minZoom) {
  				return this.setZoom(zoom);
  			}
  		}

  		return this;
  	},

  	// @method setMaxZoom(zoom: Number): this
  	// Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
  	setMaxZoom: function (zoom) {
  		var oldZoom = this.options.maxZoom;
  		this.options.maxZoom = zoom;

  		if (this._loaded && oldZoom !== zoom) {
  			this.fire('zoomlevelschange');

  			if (this.getZoom() > this.options.maxZoom) {
  				return this.setZoom(zoom);
  			}
  		}

  		return this;
  	},

  	// @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
  	// Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
  	panInsideBounds: function (bounds, options) {
  		this._enforcingBounds = true;
  		var center = this.getCenter(),
  		    newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));

  		if (!center.equals(newCenter)) {
  			this.panTo(newCenter, options);
  		}

  		this._enforcingBounds = false;
  		return this;
  	},

  	// @method panInside(latlng: LatLng, options?: options): this
  	// Pans the map the minimum amount to make the `latlng` visible. Use
  	// `padding`, `paddingTopLeft` and `paddingTopRight` options to fit
  	// the display to more restricted bounds, like [`fitBounds`](#map-fitbounds).
  	// If `latlng` is already within the (optionally padded) display bounds,
  	// the map will not be panned.
  	panInside: function (latlng, options) {
  		options = options || {};

  		var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
  		    paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
  		    center = this.getCenter(),
  		    pixelCenter = this.project(center),
  		    pixelPoint = this.project(latlng),
  		    pixelBounds = this.getPixelBounds(),
  		    halfPixelBounds = pixelBounds.getSize().divideBy(2),
  		    paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]);

  		if (!paddedBounds.contains(pixelPoint)) {
  			this._enforcingBounds = true;
  			var diff = pixelCenter.subtract(pixelPoint),
  			    newCenter = toPoint(pixelPoint.x + diff.x, pixelPoint.y + diff.y);

  			if (pixelPoint.x < paddedBounds.min.x || pixelPoint.x > paddedBounds.max.x) {
  				newCenter.x = pixelCenter.x - diff.x;
  				if (diff.x > 0) {
  					newCenter.x += halfPixelBounds.x - paddingTL.x;
  				} else {
  					newCenter.x -= halfPixelBounds.x - paddingBR.x;
  				}
  			}
  			if (pixelPoint.y < paddedBounds.min.y || pixelPoint.y > paddedBounds.max.y) {
  				newCenter.y = pixelCenter.y - diff.y;
  				if (diff.y > 0) {
  					newCenter.y += halfPixelBounds.y - paddingTL.y;
  				} else {
  					newCenter.y -= halfPixelBounds.y - paddingBR.y;
  				}
  			}
  			this.panTo(this.unproject(newCenter), options);
  			this._enforcingBounds = false;
  		}
  		return this;
  	},

  	// @method invalidateSize(options: Zoom/pan options): this
  	// Checks if the map container size changed and updates the map if so —
  	// call it after you've changed the map size dynamically, also animating
  	// pan by default. If `options.pan` is `false`, panning will not occur.
  	// If `options.debounceMoveend` is `true`, it will delay `moveend` event so
  	// that it doesn't happen often even if the method is called many
  	// times in a row.

  	// @alternative
  	// @method invalidateSize(animate: Boolean): this
  	// Checks if the map container size changed and updates the map if so —
  	// call it after you've changed the map size dynamically, also animating
  	// pan by default.
  	invalidateSize: function (options) {
  		if (!this._loaded) { return this; }

  		options = extend({
  			animate: false,
  			pan: true
  		}, options === true ? {animate: true} : options);

  		var oldSize = this.getSize();
  		this._sizeChanged = true;
  		this._lastCenter = null;

  		var newSize = this.getSize(),
  		    oldCenter = oldSize.divideBy(2).round(),
  		    newCenter = newSize.divideBy(2).round(),
  		    offset = oldCenter.subtract(newCenter);

  		if (!offset.x && !offset.y) { return this; }

  		if (options.animate && options.pan) {
  			this.panBy(offset);

  		} else {
  			if (options.pan) {
  				this._rawPanBy(offset);
  			}

  			this.fire('move');

  			if (options.debounceMoveend) {
  				clearTimeout(this._sizeTimer);
  				this._sizeTimer = setTimeout(bind(this.fire, this, 'moveend'), 200);
  			} else {
  				this.fire('moveend');
  			}
  		}

  		// @section Map state change events
  		// @event resize: ResizeEvent
  		// Fired when the map is resized.
  		return this.fire('resize', {
  			oldSize: oldSize,
  			newSize: newSize
  		});
  	},

  	// @section Methods for modifying map state
  	// @method stop(): this
  	// Stops the currently running `panTo` or `flyTo` animation, if any.
  	stop: function () {
  		this.setZoom(this._limitZoom(this._zoom));
  		if (!this.options.zoomSnap) {
  			this.fire('viewreset');
  		}
  		return this._stop();
  	},

  	// @section Geolocation methods
  	// @method locate(options?: Locate options): this
  	// Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
  	// event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
  	// and optionally sets the map view to the user's location with respect to
  	// detection accuracy (or to the world view if geolocation failed).
  	// Note that, if your page doesn't use HTTPS, this method will fail in
  	// modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
  	// See `Locate options` for more details.
  	locate: function (options) {

  		options = this._locateOptions = extend({
  			timeout: 10000,
  			watch: false
  			// setView: false
  			// maxZoom: <Number>
  			// maximumAge: 0
  			// enableHighAccuracy: false
  		}, options);

  		if (!('geolocation' in navigator)) {
  			this._handleGeolocationError({
  				code: 0,
  				message: 'Geolocation not supported.'
  			});
  			return this;
  		}

  		var onResponse = bind(this._handleGeolocationResponse, this),
  		    onError = bind(this._handleGeolocationError, this);

  		if (options.watch) {
  			this._locationWatchId =
  			        navigator.geolocation.watchPosition(onResponse, onError, options);
  		} else {
  			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
  		}
  		return this;
  	},

  	// @method stopLocate(): this
  	// Stops watching location previously initiated by `map.locate({watch: true})`
  	// and aborts resetting the map view if map.locate was called with
  	// `{setView: true}`.
  	stopLocate: function () {
  		if (navigator.geolocation && navigator.geolocation.clearWatch) {
  			navigator.geolocation.clearWatch(this._locationWatchId);
  		}
  		if (this._locateOptions) {
  			this._locateOptions.setView = false;
  		}
  		return this;
  	},

  	_handleGeolocationError: function (error) {
  		var c = error.code,
  		    message = error.message ||
  		            (c === 1 ? 'permission denied' :
  		            (c === 2 ? 'position unavailable' : 'timeout'));

  		if (this._locateOptions.setView && !this._loaded) {
  			this.fitWorld();
  		}

  		// @section Location events
  		// @event locationerror: ErrorEvent
  		// Fired when geolocation (using the [`locate`](#map-locate) method) failed.
  		this.fire('locationerror', {
  			code: c,
  			message: 'Geolocation error: ' + message + '.'
  		});
  	},

  	_handleGeolocationResponse: function (pos) {
  		var lat = pos.coords.latitude,
  		    lng = pos.coords.longitude,
  		    latlng = new LatLng(lat, lng),
  		    bounds = latlng.toBounds(pos.coords.accuracy * 2),
  		    options = this._locateOptions;

  		if (options.setView) {
  			var zoom = this.getBoundsZoom(bounds);
  			this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
  		}

  		var data = {
  			latlng: latlng,
  			bounds: bounds,
  			timestamp: pos.timestamp
  		};

  		for (var i in pos.coords) {
  			if (typeof pos.coords[i] === 'number') {
  				data[i] = pos.coords[i];
  			}
  		}

  		// @event locationfound: LocationEvent
  		// Fired when geolocation (using the [`locate`](#map-locate) method)
  		// went successfully.
  		this.fire('locationfound', data);
  	},

  	// TODO Appropriate docs section?
  	// @section Other Methods
  	// @method addHandler(name: String, HandlerClass: Function): this
  	// Adds a new `Handler` to the map, given its name and constructor function.
  	addHandler: function (name, HandlerClass) {
  		if (!HandlerClass) { return this; }

  		var handler = this[name] = new HandlerClass(this);

  		this._handlers.push(handler);

  		if (this.options[name]) {
  			handler.enable();
  		}

  		return this;
  	},

  	// @method remove(): this
  	// Destroys the map and clears all related event listeners.
  	remove: function () {

  		this._initEvents(true);
  		this.off('moveend', this._panInsideMaxBounds);

  		if (this._containerId !== this._container._leaflet_id) {
  			throw new Error('Map container is being reused by another instance');
  		}

  		try {
  			// throws error in IE6-8
  			delete this._container._leaflet_id;
  			delete this._containerId;
  		} catch (e) {
  			/*eslint-disable */
  			this._container._leaflet_id = undefined;
  			/* eslint-enable */
  			this._containerId = undefined;
  		}

  		if (this._locationWatchId !== undefined) {
  			this.stopLocate();
  		}

  		this._stop();

  		remove(this._mapPane);

  		if (this._clearControlPos) {
  			this._clearControlPos();
  		}
  		if (this._resizeRequest) {
  			cancelAnimFrame(this._resizeRequest);
  			this._resizeRequest = null;
  		}

  		this._clearHandlers();

  		if (this._loaded) {
  			// @section Map state change events
  			// @event unload: Event
  			// Fired when the map is destroyed with [remove](#map-remove) method.
  			this.fire('unload');
  		}

  		var i;
  		for (i in this._layers) {
  			this._layers[i].remove();
  		}
  		for (i in this._panes) {
  			remove(this._panes[i]);
  		}

  		this._layers = [];
  		this._panes = [];
  		delete this._mapPane;
  		delete this._renderer;

  		return this;
  	},

  	// @section Other Methods
  	// @method createPane(name: String, container?: HTMLElement): HTMLElement
  	// Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
  	// then returns it. The pane is created as a child of `container`, or
  	// as a child of the main map pane if not set.
  	createPane: function (name, container) {
  		var className = 'leaflet-pane' + (name ? ' leaflet-' + name.replace('Pane', '') + '-pane' : ''),
  		    pane = create$1('div', className, container || this._mapPane);

  		if (name) {
  			this._panes[name] = pane;
  		}
  		return pane;
  	},

  	// @section Methods for Getting Map State

  	// @method getCenter(): LatLng
  	// Returns the geographical center of the map view
  	getCenter: function () {
  		this._checkIfLoaded();

  		if (this._lastCenter && !this._moved()) {
  			return this._lastCenter;
  		}
  		return this.layerPointToLatLng(this._getCenterLayerPoint());
  	},

  	// @method getZoom(): Number
  	// Returns the current zoom level of the map view
  	getZoom: function () {
  		return this._zoom;
  	},

  	// @method getBounds(): LatLngBounds
  	// Returns the geographical bounds visible in the current map view
  	getBounds: function () {
  		var bounds = this.getPixelBounds(),
  		    sw = this.unproject(bounds.getBottomLeft()),
  		    ne = this.unproject(bounds.getTopRight());

  		return new LatLngBounds(sw, ne);
  	},

  	// @method getMinZoom(): Number
  	// Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
  	getMinZoom: function () {
  		return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
  	},

  	// @method getMaxZoom(): Number
  	// Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
  	getMaxZoom: function () {
  		return this.options.maxZoom === undefined ?
  			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
  			this.options.maxZoom;
  	},

  	// @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean, padding?: Point): Number
  	// Returns the maximum zoom level on which the given bounds fit to the map
  	// view in its entirety. If `inside` (optional) is set to `true`, the method
  	// instead returns the minimum zoom level on which the map view fits into
  	// the given bounds in its entirety.
  	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
  		bounds = toLatLngBounds(bounds);
  		padding = toPoint(padding || [0, 0]);

  		var zoom = this.getZoom() || 0,
  		    min = this.getMinZoom(),
  		    max = this.getMaxZoom(),
  		    nw = bounds.getNorthWest(),
  		    se = bounds.getSouthEast(),
  		    size = this.getSize().subtract(padding),
  		    boundsSize = toBounds(this.project(se, zoom), this.project(nw, zoom)).getSize(),
  		    snap = any3d ? this.options.zoomSnap : 1,
  		    scalex = size.x / boundsSize.x,
  		    scaley = size.y / boundsSize.y,
  		    scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);

  		zoom = this.getScaleZoom(scale, zoom);

  		if (snap) {
  			zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
  			zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
  		}

  		return Math.max(min, Math.min(max, zoom));
  	},

  	// @method getSize(): Point
  	// Returns the current size of the map container (in pixels).
  	getSize: function () {
  		if (!this._size || this._sizeChanged) {
  			this._size = new Point(
  				this._container.clientWidth || 0,
  				this._container.clientHeight || 0);

  			this._sizeChanged = false;
  		}
  		return this._size.clone();
  	},

  	// @method getPixelBounds(): Bounds
  	// Returns the bounds of the current map view in projected pixel
  	// coordinates (sometimes useful in layer and overlay implementations).
  	getPixelBounds: function (center, zoom) {
  		var topLeftPoint = this._getTopLeftPoint(center, zoom);
  		return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
  	},

  	// TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
  	// the map pane? "left point of the map layer" can be confusing, specially
  	// since there can be negative offsets.
  	// @method getPixelOrigin(): Point
  	// Returns the projected pixel coordinates of the top left point of
  	// the map layer (useful in custom layer and overlay implementations).
  	getPixelOrigin: function () {
  		this._checkIfLoaded();
  		return this._pixelOrigin;
  	},

  	// @method getPixelWorldBounds(zoom?: Number): Bounds
  	// Returns the world's bounds in pixel coordinates for zoom level `zoom`.
  	// If `zoom` is omitted, the map's current zoom level is used.
  	getPixelWorldBounds: function (zoom) {
  		return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
  	},

  	// @section Other Methods

  	// @method getPane(pane: String|HTMLElement): HTMLElement
  	// Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
  	getPane: function (pane) {
  		return typeof pane === 'string' ? this._panes[pane] : pane;
  	},

  	// @method getPanes(): Object
  	// Returns a plain object containing the names of all [panes](#map-pane) as keys and
  	// the panes as values.
  	getPanes: function () {
  		return this._panes;
  	},

  	// @method getContainer: HTMLElement
  	// Returns the HTML element that contains the map.
  	getContainer: function () {
  		return this._container;
  	},


  	// @section Conversion Methods

  	// @method getZoomScale(toZoom: Number, fromZoom: Number): Number
  	// Returns the scale factor to be applied to a map transition from zoom level
  	// `fromZoom` to `toZoom`. Used internally to help with zoom animations.
  	getZoomScale: function (toZoom, fromZoom) {
  		// TODO replace with universal implementation after refactoring projections
  		var crs = this.options.crs;
  		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
  		return crs.scale(toZoom) / crs.scale(fromZoom);
  	},

  	// @method getScaleZoom(scale: Number, fromZoom: Number): Number
  	// Returns the zoom level that the map would end up at, if it is at `fromZoom`
  	// level and everything is scaled by a factor of `scale`. Inverse of
  	// [`getZoomScale`](#map-getZoomScale).
  	getScaleZoom: function (scale, fromZoom) {
  		var crs = this.options.crs;
  		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
  		var zoom = crs.zoom(scale * crs.scale(fromZoom));
  		return isNaN(zoom) ? Infinity : zoom;
  	},

  	// @method project(latlng: LatLng, zoom: Number): Point
  	// Projects a geographical coordinate `LatLng` according to the projection
  	// of the map's CRS, then scales it according to `zoom` and the CRS's
  	// `Transformation`. The result is pixel coordinate relative to
  	// the CRS origin.
  	project: function (latlng, zoom) {
  		zoom = zoom === undefined ? this._zoom : zoom;
  		return this.options.crs.latLngToPoint(toLatLng(latlng), zoom);
  	},

  	// @method unproject(point: Point, zoom: Number): LatLng
  	// Inverse of [`project`](#map-project).
  	unproject: function (point, zoom) {
  		zoom = zoom === undefined ? this._zoom : zoom;
  		return this.options.crs.pointToLatLng(toPoint(point), zoom);
  	},

  	// @method layerPointToLatLng(point: Point): LatLng
  	// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
  	// returns the corresponding geographical coordinate (for the current zoom level).
  	layerPointToLatLng: function (point) {
  		var projectedPoint = toPoint(point).add(this.getPixelOrigin());
  		return this.unproject(projectedPoint);
  	},

  	// @method latLngToLayerPoint(latlng: LatLng): Point
  	// Given a geographical coordinate, returns the corresponding pixel coordinate
  	// relative to the [origin pixel](#map-getpixelorigin).
  	latLngToLayerPoint: function (latlng) {
  		var projectedPoint = this.project(toLatLng(latlng))._round();
  		return projectedPoint._subtract(this.getPixelOrigin());
  	},

  	// @method wrapLatLng(latlng: LatLng): LatLng
  	// Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
  	// map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
  	// CRS's bounds.
  	// By default this means longitude is wrapped around the dateline so its
  	// value is between -180 and +180 degrees.
  	wrapLatLng: function (latlng) {
  		return this.options.crs.wrapLatLng(toLatLng(latlng));
  	},

  	// @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
  	// Returns a `LatLngBounds` with the same size as the given one, ensuring that
  	// its center is within the CRS's bounds.
  	// By default this means the center longitude is wrapped around the dateline so its
  	// value is between -180 and +180 degrees, and the majority of the bounds
  	// overlaps the CRS's bounds.
  	wrapLatLngBounds: function (latlng) {
  		return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
  	},

  	// @method distance(latlng1: LatLng, latlng2: LatLng): Number
  	// Returns the distance between two geographical coordinates according to
  	// the map's CRS. By default this measures distance in meters.
  	distance: function (latlng1, latlng2) {
  		return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
  	},

  	// @method containerPointToLayerPoint(point: Point): Point
  	// Given a pixel coordinate relative to the map container, returns the corresponding
  	// pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
  	containerPointToLayerPoint: function (point) { // (Point)
  		return toPoint(point).subtract(this._getMapPanePos());
  	},

  	// @method layerPointToContainerPoint(point: Point): Point
  	// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
  	// returns the corresponding pixel coordinate relative to the map container.
  	layerPointToContainerPoint: function (point) { // (Point)
  		return toPoint(point).add(this._getMapPanePos());
  	},

  	// @method containerPointToLatLng(point: Point): LatLng
  	// Given a pixel coordinate relative to the map container, returns
  	// the corresponding geographical coordinate (for the current zoom level).
  	containerPointToLatLng: function (point) {
  		var layerPoint = this.containerPointToLayerPoint(toPoint(point));
  		return this.layerPointToLatLng(layerPoint);
  	},

  	// @method latLngToContainerPoint(latlng: LatLng): Point
  	// Given a geographical coordinate, returns the corresponding pixel coordinate
  	// relative to the map container.
  	latLngToContainerPoint: function (latlng) {
  		return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
  	},

  	// @method mouseEventToContainerPoint(ev: MouseEvent): Point
  	// Given a MouseEvent object, returns the pixel coordinate relative to the
  	// map container where the event took place.
  	mouseEventToContainerPoint: function (e) {
  		return getMousePosition(e, this._container);
  	},

  	// @method mouseEventToLayerPoint(ev: MouseEvent): Point
  	// Given a MouseEvent object, returns the pixel coordinate relative to
  	// the [origin pixel](#map-getpixelorigin) where the event took place.
  	mouseEventToLayerPoint: function (e) {
  		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
  	},

  	// @method mouseEventToLatLng(ev: MouseEvent): LatLng
  	// Given a MouseEvent object, returns geographical coordinate where the
  	// event took place.
  	mouseEventToLatLng: function (e) { // (MouseEvent)
  		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
  	},


  	// map initialization methods

  	_initContainer: function (id) {
  		var container = this._container = get(id);

  		if (!container) {
  			throw new Error('Map container not found.');
  		} else if (container._leaflet_id) {
  			throw new Error('Map container is already initialized.');
  		}

  		on(container, 'scroll', this._onScroll, this);
  		this._containerId = stamp(container);
  	},

  	_initLayout: function () {
  		var container = this._container;

  		this._fadeAnimated = this.options.fadeAnimation && any3d;

  		addClass(container, 'leaflet-container' +
  			(touch ? ' leaflet-touch' : '') +
  			(retina ? ' leaflet-retina' : '') +
  			(ielt9 ? ' leaflet-oldie' : '') +
  			(safari ? ' leaflet-safari' : '') +
  			(this._fadeAnimated ? ' leaflet-fade-anim' : ''));

  		var position = getStyle(container, 'position');

  		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
  			container.style.position = 'relative';
  		}

  		this._initPanes();

  		if (this._initControlPos) {
  			this._initControlPos();
  		}
  	},

  	_initPanes: function () {
  		var panes = this._panes = {};
  		this._paneRenderers = {};

  		// @section
  		//
  		// Panes are DOM elements used to control the ordering of layers on the map. You
  		// can access panes with [`map.getPane`](#map-getpane) or
  		// [`map.getPanes`](#map-getpanes) methods. New panes can be created with the
  		// [`map.createPane`](#map-createpane) method.
  		//
  		// Every map has the following default panes that differ only in zIndex.
  		//
  		// @pane mapPane: HTMLElement = 'auto'
  		// Pane that contains all other map panes

  		this._mapPane = this.createPane('mapPane', this._container);
  		setPosition(this._mapPane, new Point(0, 0));

  		// @pane tilePane: HTMLElement = 200
  		// Pane for `GridLayer`s and `TileLayer`s
  		this.createPane('tilePane');
  		// @pane overlayPane: HTMLElement = 400
  		// Pane for overlay shadows (e.g. `Marker` shadows)
  		this.createPane('shadowPane');
  		// @pane shadowPane: HTMLElement = 500
  		// Pane for vectors (`Path`s, like `Polyline`s and `Polygon`s), `ImageOverlay`s and `VideoOverlay`s
  		this.createPane('overlayPane');
  		// @pane markerPane: HTMLElement = 600
  		// Pane for `Icon`s of `Marker`s
  		this.createPane('markerPane');
  		// @pane tooltipPane: HTMLElement = 650
  		// Pane for `Tooltip`s.
  		this.createPane('tooltipPane');
  		// @pane popupPane: HTMLElement = 700
  		// Pane for `Popup`s.
  		this.createPane('popupPane');

  		if (!this.options.markerZoomAnimation) {
  			addClass(panes.markerPane, 'leaflet-zoom-hide');
  			addClass(panes.shadowPane, 'leaflet-zoom-hide');
  		}
  	},


  	// private methods that modify map state

  	// @section Map state change events
  	_resetView: function (center, zoom) {
  		setPosition(this._mapPane, new Point(0, 0));

  		var loading = !this._loaded;
  		this._loaded = true;
  		zoom = this._limitZoom(zoom);

  		this.fire('viewprereset');

  		var zoomChanged = this._zoom !== zoom;
  		this
  			._moveStart(zoomChanged, false)
  			._move(center, zoom)
  			._moveEnd(zoomChanged);

  		// @event viewreset: Event
  		// Fired when the map needs to redraw its content (this usually happens
  		// on map zoom or load). Very useful for creating custom overlays.
  		this.fire('viewreset');

  		// @event load: Event
  		// Fired when the map is initialized (when its center and zoom are set
  		// for the first time).
  		if (loading) {
  			this.fire('load');
  		}
  	},

  	_moveStart: function (zoomChanged, noMoveStart) {
  		// @event zoomstart: Event
  		// Fired when the map zoom is about to change (e.g. before zoom animation).
  		// @event movestart: Event
  		// Fired when the view of the map starts changing (e.g. user starts dragging the map).
  		if (zoomChanged) {
  			this.fire('zoomstart');
  		}
  		if (!noMoveStart) {
  			this.fire('movestart');
  		}
  		return this;
  	},

  	_move: function (center, zoom, data) {
  		if (zoom === undefined) {
  			zoom = this._zoom;
  		}
  		var zoomChanged = this._zoom !== zoom;

  		this._zoom = zoom;
  		this._lastCenter = center;
  		this._pixelOrigin = this._getNewPixelOrigin(center);

  		// @event zoom: Event
  		// Fired repeatedly during any change in zoom level, including zoom
  		// and fly animations.
  		if (zoomChanged || (data && data.pinch)) {	// Always fire 'zoom' if pinching because #3530
  			this.fire('zoom', data);
  		}

  		// @event move: Event
  		// Fired repeatedly during any movement of the map, including pan and
  		// fly animations.
  		return this.fire('move', data);
  	},

  	_moveEnd: function (zoomChanged) {
  		// @event zoomend: Event
  		// Fired when the map has changed, after any animations.
  		if (zoomChanged) {
  			this.fire('zoomend');
  		}

  		// @event moveend: Event
  		// Fired when the center of the map stops changing (e.g. user stopped
  		// dragging the map).
  		return this.fire('moveend');
  	},

  	_stop: function () {
  		cancelAnimFrame(this._flyToFrame);
  		if (this._panAnim) {
  			this._panAnim.stop();
  		}
  		return this;
  	},

  	_rawPanBy: function (offset) {
  		setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
  	},

  	_getZoomSpan: function () {
  		return this.getMaxZoom() - this.getMinZoom();
  	},

  	_panInsideMaxBounds: function () {
  		if (!this._enforcingBounds) {
  			this.panInsideBounds(this.options.maxBounds);
  		}
  	},

  	_checkIfLoaded: function () {
  		if (!this._loaded) {
  			throw new Error('Set map center and zoom first.');
  		}
  	},

  	// DOM event handling

  	// @section Interaction events
  	_initEvents: function (remove$$1) {
  		this._targets = {};
  		this._targets[stamp(this._container)] = this;

  		var onOff = remove$$1 ? off : on;

  		// @event click: MouseEvent
  		// Fired when the user clicks (or taps) the map.
  		// @event dblclick: MouseEvent
  		// Fired when the user double-clicks (or double-taps) the map.
  		// @event mousedown: MouseEvent
  		// Fired when the user pushes the mouse button on the map.
  		// @event mouseup: MouseEvent
  		// Fired when the user releases the mouse button on the map.
  		// @event mouseover: MouseEvent
  		// Fired when the mouse enters the map.
  		// @event mouseout: MouseEvent
  		// Fired when the mouse leaves the map.
  		// @event mousemove: MouseEvent
  		// Fired while the mouse moves over the map.
  		// @event contextmenu: MouseEvent
  		// Fired when the user pushes the right mouse button on the map, prevents
  		// default browser context menu from showing if there are listeners on
  		// this event. Also fired on mobile when the user holds a single touch
  		// for a second (also called long press).
  		// @event keypress: KeyboardEvent
  		// Fired when the user presses a key from the keyboard that produces a character value while the map is focused.
  		// @event keydown: KeyboardEvent
  		// Fired when the user presses a key from the keyboard while the map is focused. Unlike the `keypress` event,
  		// the `keydown` event is fired for keys that produce a character value and for keys
  		// that do not produce a character value.
  		// @event keyup: KeyboardEvent
  		// Fired when the user releases a key from the keyboard while the map is focused.
  		onOff(this._container, 'click dblclick mousedown mouseup ' +
  			'mouseover mouseout mousemove contextmenu keypress keydown keyup', this._handleDOMEvent, this);

  		if (this.options.trackResize) {
  			onOff(window, 'resize', this._onResize, this);
  		}

  		if (any3d && this.options.transform3DLimit) {
  			(remove$$1 ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
  		}
  	},

  	_onResize: function () {
  		cancelAnimFrame(this._resizeRequest);
  		this._resizeRequest = requestAnimFrame(
  		        function () { this.invalidateSize({debounceMoveend: true}); }, this);
  	},

  	_onScroll: function () {
  		this._container.scrollTop  = 0;
  		this._container.scrollLeft = 0;
  	},

  	_onMoveEnd: function () {
  		var pos = this._getMapPanePos();
  		if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
  			// https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
  			// a pixel offset on very high values, see: http://jsfiddle.net/dg6r5hhb/
  			this._resetView(this.getCenter(), this.getZoom());
  		}
  	},

  	_findEventTargets: function (e, type) {
  		var targets = [],
  		    target,
  		    isHover = type === 'mouseout' || type === 'mouseover',
  		    src = e.target || e.srcElement,
  		    dragging = false;

  		while (src) {
  			target = this._targets[stamp(src)];
  			if (target && (type === 'click' || type === 'preclick') && !e._simulated && this._draggableMoved(target)) {
  				// Prevent firing click after you just dragged an object.
  				dragging = true;
  				break;
  			}
  			if (target && target.listens(type, true)) {
  				if (isHover && !isExternalTarget(src, e)) { break; }
  				targets.push(target);
  				if (isHover) { break; }
  			}
  			if (src === this._container) { break; }
  			src = src.parentNode;
  		}
  		if (!targets.length && !dragging && !isHover && isExternalTarget(src, e)) {
  			targets = [this];
  		}
  		return targets;
  	},

  	_handleDOMEvent: function (e) {
  		if (!this._loaded || skipped(e)) { return; }

  		var type = e.type;

  		if (type === 'mousedown' || type === 'keypress' || type === 'keyup' || type === 'keydown') {
  			// prevents outline when clicking on keyboard-focusable element
  			preventOutline(e.target || e.srcElement);
  		}

  		this._fireDOMEvent(e, type);
  	},

  	_mouseEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu'],

  	_fireDOMEvent: function (e, type, targets) {

  		if (e.type === 'click') {
  			// Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
  			// @event preclick: MouseEvent
  			// Fired before mouse click on the map (sometimes useful when you
  			// want something to happen on click before any existing click
  			// handlers start running).
  			var synth = extend({}, e);
  			synth.type = 'preclick';
  			this._fireDOMEvent(synth, synth.type, targets);
  		}

  		if (e._stopped) { return; }

  		// Find the layer the event is propagating from and its parents.
  		targets = (targets || []).concat(this._findEventTargets(e, type));

  		if (!targets.length) { return; }

  		var target = targets[0];
  		if (type === 'contextmenu' && target.listens(type, true)) {
  			preventDefault(e);
  		}

  		var data = {
  			originalEvent: e
  		};

  		if (e.type !== 'keypress' && e.type !== 'keydown' && e.type !== 'keyup') {
  			var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
  			data.containerPoint = isMarker ?
  				this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
  			data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
  			data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
  		}

  		for (var i = 0; i < targets.length; i++) {
  			targets[i].fire(type, data, true);
  			if (data.originalEvent._stopped ||
  				(targets[i].options.bubblingMouseEvents === false && indexOf(this._mouseEvents, type) !== -1)) { return; }
  		}
  	},

  	_draggableMoved: function (obj) {
  		obj = obj.dragging && obj.dragging.enabled() ? obj : this;
  		return (obj.dragging && obj.dragging.moved()) || (this.boxZoom && this.boxZoom.moved());
  	},

  	_clearHandlers: function () {
  		for (var i = 0, len = this._handlers.length; i < len; i++) {
  			this._handlers[i].disable();
  		}
  	},

  	// @section Other Methods

  	// @method whenReady(fn: Function, context?: Object): this
  	// Runs the given function `fn` when the map gets initialized with
  	// a view (center and zoom) and at least one layer, or immediately
  	// if it's already initialized, optionally passing a function context.
  	whenReady: function (callback, context) {
  		if (this._loaded) {
  			callback.call(context || this, {target: this});
  		} else {
  			this.on('load', callback, context);
  		}
  		return this;
  	},


  	// private methods for getting map state

  	_getMapPanePos: function () {
  		return getPosition(this._mapPane) || new Point(0, 0);
  	},

  	_moved: function () {
  		var pos = this._getMapPanePos();
  		return pos && !pos.equals([0, 0]);
  	},

  	_getTopLeftPoint: function (center, zoom) {
  		var pixelOrigin = center && zoom !== undefined ?
  			this._getNewPixelOrigin(center, zoom) :
  			this.getPixelOrigin();
  		return pixelOrigin.subtract(this._getMapPanePos());
  	},

  	_getNewPixelOrigin: function (center, zoom) {
  		var viewHalf = this.getSize()._divideBy(2);
  		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
  	},

  	_latLngToNewLayerPoint: function (latlng, zoom, center) {
  		var topLeft = this._getNewPixelOrigin(center, zoom);
  		return this.project(latlng, zoom)._subtract(topLeft);
  	},

  	_latLngBoundsToNewLayerBounds: function (latLngBounds, zoom, center) {
  		var topLeft = this._getNewPixelOrigin(center, zoom);
  		return toBounds([
  			this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft),
  			this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft),
  			this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft),
  			this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)
  		]);
  	},

  	// layer point of the current center
  	_getCenterLayerPoint: function () {
  		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
  	},

  	// offset of the specified place to the current center in pixels
  	_getCenterOffset: function (latlng) {
  		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
  	},

  	// adjust center for view to get inside bounds
  	_limitCenter: function (center, zoom, bounds) {

  		if (!bounds) { return center; }

  		var centerPoint = this.project(center, zoom),
  		    viewHalf = this.getSize().divideBy(2),
  		    viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
  		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

  		// If offset is less than a pixel, ignore.
  		// This prevents unstable projections from getting into
  		// an infinite loop of tiny offsets.
  		if (offset.round().equals([0, 0])) {
  			return center;
  		}

  		return this.unproject(centerPoint.add(offset), zoom);
  	},

  	// adjust offset for view to get inside bounds
  	_limitOffset: function (offset, bounds) {
  		if (!bounds) { return offset; }

  		var viewBounds = this.getPixelBounds(),
  		    newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

  		return offset.add(this._getBoundsOffset(newBounds, bounds));
  	},

  	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
  	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
  		var projectedMaxBounds = toBounds(
  		        this.project(maxBounds.getNorthEast(), zoom),
  		        this.project(maxBounds.getSouthWest(), zoom)
  		    ),
  		    minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
  		    maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),

  		    dx = this._rebound(minOffset.x, -maxOffset.x),
  		    dy = this._rebound(minOffset.y, -maxOffset.y);

  		return new Point(dx, dy);
  	},

  	_rebound: function (left, right) {
  		return left + right > 0 ?
  			Math.round(left - right) / 2 :
  			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
  	},

  	_limitZoom: function (zoom) {
  		var min = this.getMinZoom(),
  		    max = this.getMaxZoom(),
  		    snap = any3d ? this.options.zoomSnap : 1;
  		if (snap) {
  			zoom = Math.round(zoom / snap) * snap;
  		}
  		return Math.max(min, Math.min(max, zoom));
  	},

  	_onPanTransitionStep: function () {
  		this.fire('move');
  	},

  	_onPanTransitionEnd: function () {
  		removeClass(this._mapPane, 'leaflet-pan-anim');
  		this.fire('moveend');
  	},

  	_tryAnimatedPan: function (center, options) {
  		// difference between the new and current centers in pixels
  		var offset = this._getCenterOffset(center)._trunc();

  		// don't animate too far unless animate: true specified in options
  		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

  		this.panBy(offset, options);

  		return true;
  	},

  	_createAnimProxy: function () {

  		var proxy = this._proxy = create$1('div', 'leaflet-proxy leaflet-zoom-animated');
  		this._panes.mapPane.appendChild(proxy);

  		this.on('zoomanim', function (e) {
  			var prop = TRANSFORM,
  			    transform = this._proxy.style[prop];

  			setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));

  			// workaround for case when transform is the same and so transitionend event is not fired
  			if (transform === this._proxy.style[prop] && this._animatingZoom) {
  				this._onZoomTransitionEnd();
  			}
  		}, this);

  		this.on('load moveend', this._animMoveEnd, this);

  		this._on('unload', this._destroyAnimProxy, this);
  	},

  	_destroyAnimProxy: function () {
  		remove(this._proxy);
  		this.off('load moveend', this._animMoveEnd, this);
  		delete this._proxy;
  	},

  	_animMoveEnd: function () {
  		var c = this.getCenter(),
  		    z = this.getZoom();
  		setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
  	},

  	_catchTransitionEnd: function (e) {
  		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
  			this._onZoomTransitionEnd();
  		}
  	},

  	_nothingToAnimate: function () {
  		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
  	},

  	_tryAnimatedZoom: function (center, zoom, options) {

  		if (this._animatingZoom) { return true; }

  		options = options || {};

  		// don't animate if disabled, not supported or zoom difference is too large
  		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
  		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

  		// offset is the pixel coords of the zoom origin relative to the current center
  		var scale = this.getZoomScale(zoom),
  		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

  		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
  		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

  		requestAnimFrame(function () {
  			this
  			    ._moveStart(true, false)
  			    ._animateZoom(center, zoom, true);
  		}, this);

  		return true;
  	},

  	_animateZoom: function (center, zoom, startAnim, noUpdate) {
  		if (!this._mapPane) { return; }

  		if (startAnim) {
  			this._animatingZoom = true;

  			// remember what center/zoom to set after animation
  			this._animateToCenter = center;
  			this._animateToZoom = zoom;

  			addClass(this._mapPane, 'leaflet-zoom-anim');
  		}

  		// @section Other Events
  		// @event zoomanim: ZoomAnimEvent
  		// Fired at least once per zoom animation. For continuous zoom, like pinch zooming, fired once per frame during zoom.
  		this.fire('zoomanim', {
  			center: center,
  			zoom: zoom,
  			noUpdate: noUpdate
  		});

  		// Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693
  		setTimeout(bind(this._onZoomTransitionEnd, this), 250);
  	},

  	_onZoomTransitionEnd: function () {
  		if (!this._animatingZoom) { return; }

  		if (this._mapPane) {
  			removeClass(this._mapPane, 'leaflet-zoom-anim');
  		}

  		this._animatingZoom = false;

  		this._move(this._animateToCenter, this._animateToZoom);

  		// This anim frame should prevent an obscure iOS webkit tile loading race condition.
  		requestAnimFrame(function () {
  			this._moveEnd(true);
  		}, this);
  	}
  });

  // @section

  // @factory L.map(id: String, options?: Map options)
  // Instantiates a map object given the DOM ID of a `<div>` element
  // and optionally an object literal with `Map options`.
  //
  // @alternative
  // @factory L.map(el: HTMLElement, options?: Map options)
  // Instantiates a map object given an instance of a `<div>` HTML element
  // and optionally an object literal with `Map options`.
  function createMap(id, options) {
  	return new Map(id, options);
  }

  /*
   * @class Control
   * @aka L.Control
   * @inherits Class
   *
   * L.Control is a base class for implementing map controls. Handles positioning.
   * All other controls extend from this class.
   */

  var Control = Class.extend({
  	// @section
  	// @aka Control options
  	options: {
  		// @option position: String = 'topright'
  		// The position of the control (one of the map corners). Possible values are `'topleft'`,
  		// `'topright'`, `'bottomleft'` or `'bottomright'`
  		position: 'topright'
  	},

  	initialize: function (options) {
  		setOptions(this, options);
  	},

  	/* @section
  	 * Classes extending L.Control will inherit the following methods:
  	 *
  	 * @method getPosition: string
  	 * Returns the position of the control.
  	 */
  	getPosition: function () {
  		return this.options.position;
  	},

  	// @method setPosition(position: string): this
  	// Sets the position of the control.
  	setPosition: function (position) {
  		var map = this._map;

  		if (map) {
  			map.removeControl(this);
  		}

  		this.options.position = position;

  		if (map) {
  			map.addControl(this);
  		}

  		return this;
  	},

  	// @method getContainer: HTMLElement
  	// Returns the HTMLElement that contains the control.
  	getContainer: function () {
  		return this._container;
  	},

  	// @method addTo(map: Map): this
  	// Adds the control to the given map.
  	addTo: function (map) {
  		this.remove();
  		this._map = map;

  		var container = this._container = this.onAdd(map),
  		    pos = this.getPosition(),
  		    corner = map._controlCorners[pos];

  		addClass(container, 'leaflet-control');

  		if (pos.indexOf('bottom') !== -1) {
  			corner.insertBefore(container, corner.firstChild);
  		} else {
  			corner.appendChild(container);
  		}

  		this._map.on('unload', this.remove, this);

  		return this;
  	},

  	// @method remove: this
  	// Removes the control from the map it is currently active on.
  	remove: function () {
  		if (!this._map) {
  			return this;
  		}

  		remove(this._container);

  		if (this.onRemove) {
  			this.onRemove(this._map);
  		}

  		this._map.off('unload', this.remove, this);
  		this._map = null;

  		return this;
  	},

  	_refocusOnMap: function (e) {
  		// if map exists and event is not a keyboard event
  		if (this._map && e && e.screenX > 0 && e.screenY > 0) {
  			this._map.getContainer().focus();
  		}
  	}
  });

  var control = function (options) {
  	return new Control(options);
  };

  /* @section Extension methods
   * @uninheritable
   *
   * Every control should extend from `L.Control` and (re-)implement the following methods.
   *
   * @method onAdd(map: Map): HTMLElement
   * Should return the container DOM element for the control and add listeners on relevant map events. Called on [`control.addTo(map)`](#control-addTo).
   *
   * @method onRemove(map: Map)
   * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
   */

  /* @namespace Map
   * @section Methods for Layers and Controls
   */
  Map.include({
  	// @method addControl(control: Control): this
  	// Adds the given control to the map
  	addControl: function (control) {
  		control.addTo(this);
  		return this;
  	},

  	// @method removeControl(control: Control): this
  	// Removes the given control from the map
  	removeControl: function (control) {
  		control.remove();
  		return this;
  	},

  	_initControlPos: function () {
  		var corners = this._controlCorners = {},
  		    l = 'leaflet-',
  		    container = this._controlContainer =
  		            create$1('div', l + 'control-container', this._container);

  		function createCorner(vSide, hSide) {
  			var className = l + vSide + ' ' + l + hSide;

  			corners[vSide + hSide] = create$1('div', className, container);
  		}

  		createCorner('top', 'left');
  		createCorner('top', 'right');
  		createCorner('bottom', 'left');
  		createCorner('bottom', 'right');
  	},

  	_clearControlPos: function () {
  		for (var i in this._controlCorners) {
  			remove(this._controlCorners[i]);
  		}
  		remove(this._controlContainer);
  		delete this._controlCorners;
  		delete this._controlContainer;
  	}
  });

  /*
   * @class Control.Layers
   * @aka L.Control.Layers
   * @inherits Control
   *
   * The layers control gives users the ability to switch between different base layers and switch overlays on/off (check out the [detailed example](http://leafletjs.com/examples/layers-control/)). Extends `Control`.
   *
   * @example
   *
   * ```js
   * var baseLayers = {
   * 	"Mapbox": mapbox,
   * 	"OpenStreetMap": osm
   * };
   *
   * var overlays = {
   * 	"Marker": marker,
   * 	"Roads": roadsLayer
   * };
   *
   * L.control.layers(baseLayers, overlays).addTo(map);
   * ```
   *
   * The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
   *
   * ```js
   * {
   *     "<someName1>": layer1,
   *     "<someName2>": layer2
   * }
   * ```
   *
   * The layer names can contain HTML, which allows you to add additional styling to the items:
   *
   * ```js
   * {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
   * ```
   */

  var Layers = Control.extend({
  	// @section
  	// @aka Control.Layers options
  	options: {
  		// @option collapsed: Boolean = true
  		// If `true`, the control will be collapsed into an icon and expanded on mouse hover or touch.
  		collapsed: true,
  		position: 'topright',

  		// @option autoZIndex: Boolean = true
  		// If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
  		autoZIndex: true,

  		// @option hideSingleBase: Boolean = false
  		// If `true`, the base layers in the control will be hidden when there is only one.
  		hideSingleBase: false,

  		// @option sortLayers: Boolean = false
  		// Whether to sort the layers. When `false`, layers will keep the order
  		// in which they were added to the control.
  		sortLayers: false,

  		// @option sortFunction: Function = *
  		// A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
  		// that will be used for sorting the layers, when `sortLayers` is `true`.
  		// The function receives both the `L.Layer` instances and their names, as in
  		// `sortFunction(layerA, layerB, nameA, nameB)`.
  		// By default, it sorts layers alphabetically by their name.
  		sortFunction: function (layerA, layerB, nameA, nameB) {
  			return nameA < nameB ? -1 : (nameB < nameA ? 1 : 0);
  		}
  	},

  	initialize: function (baseLayers, overlays, options) {
  		setOptions(this, options);

  		this._layerControlInputs = [];
  		this._layers = [];
  		this._lastZIndex = 0;
  		this._handlingClick = false;

  		for (var i in baseLayers) {
  			this._addLayer(baseLayers[i], i);
  		}

  		for (i in overlays) {
  			this._addLayer(overlays[i], i, true);
  		}
  	},

  	onAdd: function (map) {
  		this._initLayout();
  		this._update();

  		this._map = map;
  		map.on('zoomend', this._checkDisabledLayers, this);

  		for (var i = 0; i < this._layers.length; i++) {
  			this._layers[i].layer.on('add remove', this._onLayerChange, this);
  		}

  		return this._container;
  	},

  	addTo: function (map) {
  		Control.prototype.addTo.call(this, map);
  		// Trigger expand after Layers Control has been inserted into DOM so that is now has an actual height.
  		return this._expandIfNotCollapsed();
  	},

  	onRemove: function () {
  		this._map.off('zoomend', this._checkDisabledLayers, this);

  		for (var i = 0; i < this._layers.length; i++) {
  			this._layers[i].layer.off('add remove', this._onLayerChange, this);
  		}
  	},

  	// @method addBaseLayer(layer: Layer, name: String): this
  	// Adds a base layer (radio button entry) with the given name to the control.
  	addBaseLayer: function (layer, name) {
  		this._addLayer(layer, name);
  		return (this._map) ? this._update() : this;
  	},

  	// @method addOverlay(layer: Layer, name: String): this
  	// Adds an overlay (checkbox entry) with the given name to the control.
  	addOverlay: function (layer, name) {
  		this._addLayer(layer, name, true);
  		return (this._map) ? this._update() : this;
  	},

  	// @method removeLayer(layer: Layer): this
  	// Remove the given layer from the control.
  	removeLayer: function (layer) {
  		layer.off('add remove', this._onLayerChange, this);

  		var obj = this._getLayer(stamp(layer));
  		if (obj) {
  			this._layers.splice(this._layers.indexOf(obj), 1);
  		}
  		return (this._map) ? this._update() : this;
  	},

  	// @method expand(): this
  	// Expand the control container if collapsed.
  	expand: function () {
  		addClass(this._container, 'leaflet-control-layers-expanded');
  		this._section.style.height = null;
  		var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
  		if (acceptableHeight < this._section.clientHeight) {
  			addClass(this._section, 'leaflet-control-layers-scrollbar');
  			this._section.style.height = acceptableHeight + 'px';
  		} else {
  			removeClass(this._section, 'leaflet-control-layers-scrollbar');
  		}
  		this._checkDisabledLayers();
  		return this;
  	},

  	// @method collapse(): this
  	// Collapse the control container if expanded.
  	collapse: function () {
  		removeClass(this._container, 'leaflet-control-layers-expanded');
  		return this;
  	},

  	_initLayout: function () {
  		var className = 'leaflet-control-layers',
  		    container = this._container = create$1('div', className),
  		    collapsed = this.options.collapsed;

  		// makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
  		container.setAttribute('aria-haspopup', true);

  		disableClickPropagation(container);
  		disableScrollPropagation(container);

  		var section = this._section = create$1('section', className + '-list');

  		if (collapsed) {
  			this._map.on('click', this.collapse, this);

  			if (!android) {
  				on(container, {
  					mouseenter: this.expand,
  					mouseleave: this.collapse
  				}, this);
  			}
  		}

  		var link = this._layersLink = create$1('a', className + '-toggle', container);
  		link.href = '#';
  		link.title = 'Layers';

  		if (touch) {
  			on(link, 'click', stop);
  			on(link, 'click', this.expand, this);
  		} else {
  			on(link, 'focus', this.expand, this);
  		}

  		if (!collapsed) {
  			this.expand();
  		}

  		this._baseLayersList = create$1('div', className + '-base', section);
  		this._separator = create$1('div', className + '-separator', section);
  		this._overlaysList = create$1('div', className + '-overlays', section);

  		container.appendChild(section);
  	},

  	_getLayer: function (id) {
  		for (var i = 0; i < this._layers.length; i++) {

  			if (this._layers[i] && stamp(this._layers[i].layer) === id) {
  				return this._layers[i];
  			}
  		}
  	},

  	_addLayer: function (layer, name, overlay) {
  		if (this._map) {
  			layer.on('add remove', this._onLayerChange, this);
  		}

  		this._layers.push({
  			layer: layer,
  			name: name,
  			overlay: overlay
  		});

  		if (this.options.sortLayers) {
  			this._layers.sort(bind(function (a, b) {
  				return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
  			}, this));
  		}

  		if (this.options.autoZIndex && layer.setZIndex) {
  			this._lastZIndex++;
  			layer.setZIndex(this._lastZIndex);
  		}

  		this._expandIfNotCollapsed();
  	},

  	_update: function () {
  		if (!this._container) { return this; }

  		empty(this._baseLayersList);
  		empty(this._overlaysList);

  		this._layerControlInputs = [];
  		var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

  		for (i = 0; i < this._layers.length; i++) {
  			obj = this._layers[i];
  			this._addItem(obj);
  			overlaysPresent = overlaysPresent || obj.overlay;
  			baseLayersPresent = baseLayersPresent || !obj.overlay;
  			baseLayersCount += !obj.overlay ? 1 : 0;
  		}

  		// Hide base layers section if there's only one layer.
  		if (this.options.hideSingleBase) {
  			baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
  			this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
  		}

  		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

  		return this;
  	},

  	_onLayerChange: function (e) {
  		if (!this._handlingClick) {
  			this._update();
  		}

  		var obj = this._getLayer(stamp(e.target));

  		// @namespace Map
  		// @section Layer events
  		// @event baselayerchange: LayersControlEvent
  		// Fired when the base layer is changed through the [layers control](#control-layers).
  		// @event overlayadd: LayersControlEvent
  		// Fired when an overlay is selected through the [layers control](#control-layers).
  		// @event overlayremove: LayersControlEvent
  		// Fired when an overlay is deselected through the [layers control](#control-layers).
  		// @namespace Control.Layers
  		var type = obj.overlay ?
  			(e.type === 'add' ? 'overlayadd' : 'overlayremove') :
  			(e.type === 'add' ? 'baselayerchange' : null);

  		if (type) {
  			this._map.fire(type, obj);
  		}
  	},

  	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
  	_createRadioElement: function (name, checked) {

  		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' +
  				name + '"' + (checked ? ' checked="checked"' : '') + '/>';

  		var radioFragment = document.createElement('div');
  		radioFragment.innerHTML = radioHtml;

  		return radioFragment.firstChild;
  	},

  	_addItem: function (obj) {
  		var label = document.createElement('label'),
  		    checked = this._map.hasLayer(obj.layer),
  		    input;

  		if (obj.overlay) {
  			input = document.createElement('input');
  			input.type = 'checkbox';
  			input.className = 'leaflet-control-layers-selector';
  			input.defaultChecked = checked;
  		} else {
  			input = this._createRadioElement('leaflet-base-layers_' + stamp(this), checked);
  		}

  		this._layerControlInputs.push(input);
  		input.layerId = stamp(obj.layer);

  		on(input, 'click', this._onInputClick, this);

  		var name = document.createElement('span');
  		name.innerHTML = ' ' + obj.name;

  		// Helps from preventing layer control flicker when checkboxes are disabled
  		// https://github.com/Leaflet/Leaflet/issues/2771
  		var holder = document.createElement('div');

  		label.appendChild(holder);
  		holder.appendChild(input);
  		holder.appendChild(name);

  		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
  		container.appendChild(label);

  		this._checkDisabledLayers();
  		return label;
  	},

  	_onInputClick: function () {
  		var inputs = this._layerControlInputs,
  		    input, layer;
  		var addedLayers = [],
  		    removedLayers = [];

  		this._handlingClick = true;

  		for (var i = inputs.length - 1; i >= 0; i--) {
  			input = inputs[i];
  			layer = this._getLayer(input.layerId).layer;

  			if (input.checked) {
  				addedLayers.push(layer);
  			} else if (!input.checked) {
  				removedLayers.push(layer);
  			}
  		}

  		// Bugfix issue 2318: Should remove all old layers before readding new ones
  		for (i = 0; i < removedLayers.length; i++) {
  			if (this._map.hasLayer(removedLayers[i])) {
  				this._map.removeLayer(removedLayers[i]);
  			}
  		}
  		for (i = 0; i < addedLayers.length; i++) {
  			if (!this._map.hasLayer(addedLayers[i])) {
  				this._map.addLayer(addedLayers[i]);
  			}
  		}

  		this._handlingClick = false;

  		this._refocusOnMap();
  	},

  	_checkDisabledLayers: function () {
  		var inputs = this._layerControlInputs,
  		    input,
  		    layer,
  		    zoom = this._map.getZoom();

  		for (var i = inputs.length - 1; i >= 0; i--) {
  			input = inputs[i];
  			layer = this._getLayer(input.layerId).layer;
  			input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
  			                 (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom);

  		}
  	},

  	_expandIfNotCollapsed: function () {
  		if (this._map && !this.options.collapsed) {
  			this.expand();
  		}
  		return this;
  	},

  	_expand: function () {
  		// Backward compatibility, remove me in 1.1.
  		return this.expand();
  	},

  	_collapse: function () {
  		// Backward compatibility, remove me in 1.1.
  		return this.collapse();
  	}

  });


  // @factory L.control.layers(baselayers?: Object, overlays?: Object, options?: Control.Layers options)
  // Creates a layers control with the given layers. Base layers will be switched with radio buttons, while overlays will be switched with checkboxes. Note that all base layers should be passed in the base layers object, but only one should be added to the map during map instantiation.
  var layers = function (baseLayers, overlays, options) {
  	return new Layers(baseLayers, overlays, options);
  };

  /*
   * @class Control.Zoom
   * @aka L.Control.Zoom
   * @inherits Control
   *
   * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`. Extends `Control`.
   */

  var Zoom = Control.extend({
  	// @section
  	// @aka Control.Zoom options
  	options: {
  		position: 'topleft',

  		// @option zoomInText: String = '+'
  		// The text set on the 'zoom in' button.
  		zoomInText: '+',

  		// @option zoomInTitle: String = 'Zoom in'
  		// The title set on the 'zoom in' button.
  		zoomInTitle: 'Zoom in',

  		// @option zoomOutText: String = '&#x2212;'
  		// The text set on the 'zoom out' button.
  		zoomOutText: '&#x2212;',

  		// @option zoomOutTitle: String = 'Zoom out'
  		// The title set on the 'zoom out' button.
  		zoomOutTitle: 'Zoom out'
  	},

  	onAdd: function (map) {
  		var zoomName = 'leaflet-control-zoom',
  		    container = create$1('div', zoomName + ' leaflet-bar'),
  		    options = this.options;

  		this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
  		        zoomName + '-in',  container, this._zoomIn);
  		this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
  		        zoomName + '-out', container, this._zoomOut);

  		this._updateDisabled();
  		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

  		return container;
  	},

  	onRemove: function (map) {
  		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
  	},

  	disable: function () {
  		this._disabled = true;
  		this._updateDisabled();
  		return this;
  	},

  	enable: function () {
  		this._disabled = false;
  		this._updateDisabled();
  		return this;
  	},

  	_zoomIn: function (e) {
  		if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
  			this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
  		}
  	},

  	_zoomOut: function (e) {
  		if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
  			this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
  		}
  	},

  	_createButton: function (html, title, className, container, fn) {
  		var link = create$1('a', className, container);
  		link.innerHTML = html;
  		link.href = '#';
  		link.title = title;

  		/*
  		 * Will force screen readers like VoiceOver to read this as "Zoom in - button"
  		 */
  		link.setAttribute('role', 'button');
  		link.setAttribute('aria-label', title);

  		disableClickPropagation(link);
  		on(link, 'click', stop);
  		on(link, 'click', fn, this);
  		on(link, 'click', this._refocusOnMap, this);

  		return link;
  	},

  	_updateDisabled: function () {
  		var map = this._map,
  		    className = 'leaflet-disabled';

  		removeClass(this._zoomInButton, className);
  		removeClass(this._zoomOutButton, className);

  		if (this._disabled || map._zoom === map.getMinZoom()) {
  			addClass(this._zoomOutButton, className);
  		}
  		if (this._disabled || map._zoom === map.getMaxZoom()) {
  			addClass(this._zoomInButton, className);
  		}
  	}
  });

  // @namespace Map
  // @section Control options
  // @option zoomControl: Boolean = true
  // Whether a [zoom control](#control-zoom) is added to the map by default.
  Map.mergeOptions({
  	zoomControl: true
  });

  Map.addInitHook(function () {
  	if (this.options.zoomControl) {
  		// @section Controls
  		// @property zoomControl: Control.Zoom
  		// The default zoom control (only available if the
  		// [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
  		this.zoomControl = new Zoom();
  		this.addControl(this.zoomControl);
  	}
  });

  // @namespace Control.Zoom
  // @factory L.control.zoom(options: Control.Zoom options)
  // Creates a zoom control
  var zoom = function (options) {
  	return new Zoom(options);
  };

  /*
   * @class Control.Scale
   * @aka L.Control.Scale
   * @inherits Control
   *
   * A simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems. Extends `Control`.
   *
   * @example
   *
   * ```js
   * L.control.scale().addTo(map);
   * ```
   */

  var Scale = Control.extend({
  	// @section
  	// @aka Control.Scale options
  	options: {
  		position: 'bottomleft',

  		// @option maxWidth: Number = 100
  		// Maximum width of the control in pixels. The width is set dynamically to show round values (e.g. 100, 200, 500).
  		maxWidth: 100,

  		// @option metric: Boolean = True
  		// Whether to show the metric scale line (m/km).
  		metric: true,

  		// @option imperial: Boolean = True
  		// Whether to show the imperial scale line (mi/ft).
  		imperial: true

  		// @option updateWhenIdle: Boolean = false
  		// If `true`, the control is updated on [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on [`move`](#map-move)).
  	},

  	onAdd: function (map) {
  		var className = 'leaflet-control-scale',
  		    container = create$1('div', className),
  		    options = this.options;

  		this._addScales(options, className + '-line', container);

  		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
  		map.whenReady(this._update, this);

  		return container;
  	},

  	onRemove: function (map) {
  		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
  	},

  	_addScales: function (options, className, container) {
  		if (options.metric) {
  			this._mScale = create$1('div', className, container);
  		}
  		if (options.imperial) {
  			this._iScale = create$1('div', className, container);
  		}
  	},

  	_update: function () {
  		var map = this._map,
  		    y = map.getSize().y / 2;

  		var maxMeters = map.distance(
  			map.containerPointToLatLng([0, y]),
  			map.containerPointToLatLng([this.options.maxWidth, y]));

  		this._updateScales(maxMeters);
  	},

  	_updateScales: function (maxMeters) {
  		if (this.options.metric && maxMeters) {
  			this._updateMetric(maxMeters);
  		}
  		if (this.options.imperial && maxMeters) {
  			this._updateImperial(maxMeters);
  		}
  	},

  	_updateMetric: function (maxMeters) {
  		var meters = this._getRoundNum(maxMeters),
  		    label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

  		this._updateScale(this._mScale, label, meters / maxMeters);
  	},

  	_updateImperial: function (maxMeters) {
  		var maxFeet = maxMeters * 3.2808399,
  		    maxMiles, miles, feet;

  		if (maxFeet > 5280) {
  			maxMiles = maxFeet / 5280;
  			miles = this._getRoundNum(maxMiles);
  			this._updateScale(this._iScale, miles + ' mi', miles / maxMiles);

  		} else {
  			feet = this._getRoundNum(maxFeet);
  			this._updateScale(this._iScale, feet + ' ft', feet / maxFeet);
  		}
  	},

  	_updateScale: function (scale, text, ratio) {
  		scale.style.width = Math.round(this.options.maxWidth * ratio) + 'px';
  		scale.innerHTML = text;
  	},

  	_getRoundNum: function (num) {
  		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
  		    d = num / pow10;

  		d = d >= 10 ? 10 :
  		    d >= 5 ? 5 :
  		    d >= 3 ? 3 :
  		    d >= 2 ? 2 : 1;

  		return pow10 * d;
  	}
  });


  // @factory L.control.scale(options?: Control.Scale options)
  // Creates an scale control with the given options.
  var scale = function (options) {
  	return new Scale(options);
  };

  /*
   * @class Control.Attribution
   * @aka L.Control.Attribution
   * @inherits Control
   *
   * The attribution control allows you to display attribution data in a small text box on a map. It is put on the map by default unless you set its [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches attribution texts from layers with the [`getAttribution` method](#layer-getattribution) automatically. Extends Control.
   */

  var Attribution = Control.extend({
  	// @section
  	// @aka Control.Attribution options
  	options: {
  		position: 'bottomright',

  		// @option prefix: String = 'Leaflet'
  		// The HTML text shown before the attributions. Pass `false` to disable.
  		prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
  	},

  	initialize: function (options) {
  		setOptions(this, options);

  		this._attributions = {};
  	},

  	onAdd: function (map) {
  		map.attributionControl = this;
  		this._container = create$1('div', 'leaflet-control-attribution');
  		disableClickPropagation(this._container);

  		// TODO ugly, refactor
  		for (var i in map._layers) {
  			if (map._layers[i].getAttribution) {
  				this.addAttribution(map._layers[i].getAttribution());
  			}
  		}

  		this._update();

  		return this._container;
  	},

  	// @method setPrefix(prefix: String): this
  	// Sets the text before the attributions.
  	setPrefix: function (prefix) {
  		this.options.prefix = prefix;
  		this._update();
  		return this;
  	},

  	// @method addAttribution(text: String): this
  	// Adds an attribution text (e.g. `'Vector data &copy; Mapbox'`).
  	addAttribution: function (text) {
  		if (!text) { return this; }

  		if (!this._attributions[text]) {
  			this._attributions[text] = 0;
  		}
  		this._attributions[text]++;

  		this._update();

  		return this;
  	},

  	// @method removeAttribution(text: String): this
  	// Removes an attribution text.
  	removeAttribution: function (text) {
  		if (!text) { return this; }

  		if (this._attributions[text]) {
  			this._attributions[text]--;
  			this._update();
  		}

  		return this;
  	},

  	_update: function () {
  		if (!this._map) { return; }

  		var attribs = [];

  		for (var i in this._attributions) {
  			if (this._attributions[i]) {
  				attribs.push(i);
  			}
  		}

  		var prefixAndAttribs = [];

  		if (this.options.prefix) {
  			prefixAndAttribs.push(this.options.prefix);
  		}
  		if (attribs.length) {
  			prefixAndAttribs.push(attribs.join(', '));
  		}

  		this._container.innerHTML = prefixAndAttribs.join(' | ');
  	}
  });

  // @namespace Map
  // @section Control options
  // @option attributionControl: Boolean = true
  // Whether a [attribution control](#control-attribution) is added to the map by default.
  Map.mergeOptions({
  	attributionControl: true
  });

  Map.addInitHook(function () {
  	if (this.options.attributionControl) {
  		new Attribution().addTo(this);
  	}
  });

  // @namespace Control.Attribution
  // @factory L.control.attribution(options: Control.Attribution options)
  // Creates an attribution control.
  var attribution = function (options) {
  	return new Attribution(options);
  };

  Control.Layers = Layers;
  Control.Zoom = Zoom;
  Control.Scale = Scale;
  Control.Attribution = Attribution;

  control.layers = layers;
  control.zoom = zoom;
  control.scale = scale;
  control.attribution = attribution;

  /*
  	L.Handler is a base class for handler classes that are used internally to inject
  	interaction features like dragging to classes like Map and Marker.
  */

  // @class Handler
  // @aka L.Handler
  // Abstract class for map interaction handlers

  var Handler = Class.extend({
  	initialize: function (map) {
  		this._map = map;
  	},

  	// @method enable(): this
  	// Enables the handler
  	enable: function () {
  		if (this._enabled) { return this; }

  		this._enabled = true;
  		this.addHooks();
  		return this;
  	},

  	// @method disable(): this
  	// Disables the handler
  	disable: function () {
  		if (!this._enabled) { return this; }

  		this._enabled = false;
  		this.removeHooks();
  		return this;
  	},

  	// @method enabled(): Boolean
  	// Returns `true` if the handler is enabled
  	enabled: function () {
  		return !!this._enabled;
  	}

  	// @section Extension methods
  	// Classes inheriting from `Handler` must implement the two following methods:
  	// @method addHooks()
  	// Called when the handler is enabled, should add event hooks.
  	// @method removeHooks()
  	// Called when the handler is disabled, should remove the event hooks added previously.
  });

  // @section There is static function which can be called without instantiating L.Handler:
  // @function addTo(map: Map, name: String): this
  // Adds a new Handler to the given map with the given name.
  Handler.addTo = function (map, name) {
  	map.addHandler(name, this);
  	return this;
  };

  var Mixin = {Events: Events};

  /*
   * @class Draggable
   * @aka L.Draggable
   * @inherits Evented
   *
   * A class for making DOM elements draggable (including touch support).
   * Used internally for map and marker dragging. Only works for elements
   * that were positioned with [`L.DomUtil.setPosition`](#domutil-setposition).
   *
   * @example
   * ```js
   * var draggable = new L.Draggable(elementToDrag);
   * draggable.enable();
   * ```
   */

  var START = touch ? 'touchstart mousedown' : 'mousedown';
  var END = {
  	mousedown: 'mouseup',
  	touchstart: 'touchend',
  	pointerdown: 'touchend',
  	MSPointerDown: 'touchend'
  };
  var MOVE = {
  	mousedown: 'mousemove',
  	touchstart: 'touchmove',
  	pointerdown: 'touchmove',
  	MSPointerDown: 'touchmove'
  };


  var Draggable = Evented.extend({

  	options: {
  		// @section
  		// @aka Draggable options
  		// @option clickTolerance: Number = 3
  		// The max number of pixels a user can shift the mouse pointer during a click
  		// for it to be considered a valid click (as opposed to a mouse drag).
  		clickTolerance: 3
  	},

  	// @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline?: Boolean, options?: Draggable options)
  	// Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
  	initialize: function (element, dragStartTarget, preventOutline$$1, options) {
  		setOptions(this, options);

  		this._element = element;
  		this._dragStartTarget = dragStartTarget || element;
  		this._preventOutline = preventOutline$$1;
  	},

  	// @method enable()
  	// Enables the dragging ability
  	enable: function () {
  		if (this._enabled) { return; }

  		on(this._dragStartTarget, START, this._onDown, this);

  		this._enabled = true;
  	},

  	// @method disable()
  	// Disables the dragging ability
  	disable: function () {
  		if (!this._enabled) { return; }

  		// If we're currently dragging this draggable,
  		// disabling it counts as first ending the drag.
  		if (Draggable._dragging === this) {
  			this.finishDrag();
  		}

  		off(this._dragStartTarget, START, this._onDown, this);

  		this._enabled = false;
  		this._moved = false;
  	},

  	_onDown: function (e) {
  		// Ignore simulated events, since we handle both touch and
  		// mouse explicitly; otherwise we risk getting duplicates of
  		// touch events, see #4315.
  		// Also ignore the event if disabled; this happens in IE11
  		// under some circumstances, see #3666.
  		if (e._simulated || !this._enabled) { return; }

  		this._moved = false;

  		if (hasClass(this._element, 'leaflet-zoom-anim')) { return; }

  		if (Draggable._dragging || e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }
  		Draggable._dragging = this;  // Prevent dragging multiple objects at once.

  		if (this._preventOutline) {
  			preventOutline(this._element);
  		}

  		disableImageDrag();
  		disableTextSelection();

  		if (this._moving) { return; }

  		// @event down: Event
  		// Fired when a drag is about to start.
  		this.fire('down');

  		var first = e.touches ? e.touches[0] : e,
  		    sizedParent = getSizedParentNode(this._element);

  		this._startPoint = new Point(first.clientX, first.clientY);

  		// Cache the scale, so that we can continuously compensate for it during drag (_onMove).
  		this._parentScale = getScale(sizedParent);

  		on(document, MOVE[e.type], this._onMove, this);
  		on(document, END[e.type], this._onUp, this);
  	},

  	_onMove: function (e) {
  		// Ignore simulated events, since we handle both touch and
  		// mouse explicitly; otherwise we risk getting duplicates of
  		// touch events, see #4315.
  		// Also ignore the event if disabled; this happens in IE11
  		// under some circumstances, see #3666.
  		if (e._simulated || !this._enabled) { return; }

  		if (e.touches && e.touches.length > 1) {
  			this._moved = true;
  			return;
  		}

  		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
  		    offset = new Point(first.clientX, first.clientY)._subtract(this._startPoint);

  		if (!offset.x && !offset.y) { return; }
  		if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) { return; }

  		// We assume that the parent container's position, border and scale do not change for the duration of the drag.
  		// Therefore there is no need to account for the position and border (they are eliminated by the subtraction)
  		// and we can use the cached value for the scale.
  		offset.x /= this._parentScale.x;
  		offset.y /= this._parentScale.y;

  		preventDefault(e);

  		if (!this._moved) {
  			// @event dragstart: Event
  			// Fired when a drag starts
  			this.fire('dragstart');

  			this._moved = true;
  			this._startPos = getPosition(this._element).subtract(offset);

  			addClass(document.body, 'leaflet-dragging');

  			this._lastTarget = e.target || e.srcElement;
  			// IE and Edge do not give the <use> element, so fetch it
  			// if necessary
  			if (window.SVGElementInstance && this._lastTarget instanceof window.SVGElementInstance) {
  				this._lastTarget = this._lastTarget.correspondingUseElement;
  			}
  			addClass(this._lastTarget, 'leaflet-drag-target');
  		}

  		this._newPos = this._startPos.add(offset);
  		this._moving = true;

  		cancelAnimFrame(this._animRequest);
  		this._lastEvent = e;
  		this._animRequest = requestAnimFrame(this._updatePosition, this, true);
  	},

  	_updatePosition: function () {
  		var e = {originalEvent: this._lastEvent};

  		// @event predrag: Event
  		// Fired continuously during dragging *before* each corresponding
  		// update of the element's position.
  		this.fire('predrag', e);
  		setPosition(this._element, this._newPos);

  		// @event drag: Event
  		// Fired continuously during dragging.
  		this.fire('drag', e);
  	},

  	_onUp: function (e) {
  		// Ignore simulated events, since we handle both touch and
  		// mouse explicitly; otherwise we risk getting duplicates of
  		// touch events, see #4315.
  		// Also ignore the event if disabled; this happens in IE11
  		// under some circumstances, see #3666.
  		if (e._simulated || !this._enabled) { return; }
  		this.finishDrag();
  	},

  	finishDrag: function () {
  		removeClass(document.body, 'leaflet-dragging');

  		if (this._lastTarget) {
  			removeClass(this._lastTarget, 'leaflet-drag-target');
  			this._lastTarget = null;
  		}

  		for (var i in MOVE) {
  			off(document, MOVE[i], this._onMove, this);
  			off(document, END[i], this._onUp, this);
  		}

  		enableImageDrag();
  		enableTextSelection();

  		if (this._moved && this._moving) {
  			// ensure drag is not fired after dragend
  			cancelAnimFrame(this._animRequest);

  			// @event dragend: DragEndEvent
  			// Fired when the drag ends.
  			this.fire('dragend', {
  				distance: this._newPos.distanceTo(this._startPos)
  			});
  		}

  		this._moving = false;
  		Draggable._dragging = false;
  	}

  });

  /*
   * @namespace LineUtil
   *
   * Various utility functions for polyline points processing, used by Leaflet internally to make polylines lightning-fast.
   */

  // Simplify polyline with vertex reduction and Douglas-Peucker simplification.
  // Improves rendering performance dramatically by lessening the number of points to draw.

  // @function simplify(points: Point[], tolerance: Number): Point[]
  // Dramatically reduces the number of points in a polyline while retaining
  // its shape and returns a new array of simplified points, using the
  // [Douglas-Peucker algorithm](http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm).
  // Used for a huge performance boost when processing/displaying Leaflet polylines for
  // each zoom level and also reducing visual noise. tolerance affects the amount of
  // simplification (lesser value means higher quality but slower and with more points).
  // Also released as a separated micro-library [Simplify.js](http://mourner.github.com/simplify-js/).
  function simplify(points, tolerance) {
  	if (!tolerance || !points.length) {
  		return points.slice();
  	}

  	var sqTolerance = tolerance * tolerance;

  	    // stage 1: vertex reduction
  	    points = _reducePoints(points, sqTolerance);

  	    // stage 2: Douglas-Peucker simplification
  	    points = _simplifyDP(points, sqTolerance);

  	return points;
  }

  // @function pointToSegmentDistance(p: Point, p1: Point, p2: Point): Number
  // Returns the distance between point `p` and segment `p1` to `p2`.
  function pointToSegmentDistance(p, p1, p2) {
  	return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
  }

  // @function closestPointOnSegment(p: Point, p1: Point, p2: Point): Number
  // Returns the closest point from a point `p` on a segment `p1` to `p2`.
  function closestPointOnSegment(p, p1, p2) {
  	return _sqClosestPointOnSegment(p, p1, p2);
  }

  // Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
  function _simplifyDP(points, sqTolerance) {

  	var len = points.length,
  	    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
  	    markers = new ArrayConstructor(len);

  	    markers[0] = markers[len - 1] = 1;

  	_simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

  	var i,
  	    newPoints = [];

  	for (i = 0; i < len; i++) {
  		if (markers[i]) {
  			newPoints.push(points[i]);
  		}
  	}

  	return newPoints;
  }

  function _simplifyDPStep(points, markers, sqTolerance, first, last) {

  	var maxSqDist = 0,
  	index, i, sqDist;

  	for (i = first + 1; i <= last - 1; i++) {
  		sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);

  		if (sqDist > maxSqDist) {
  			index = i;
  			maxSqDist = sqDist;
  		}
  	}

  	if (maxSqDist > sqTolerance) {
  		markers[index] = 1;

  		_simplifyDPStep(points, markers, sqTolerance, first, index);
  		_simplifyDPStep(points, markers, sqTolerance, index, last);
  	}
  }

  // reduce points that are too close to each other to a single point
  function _reducePoints(points, sqTolerance) {
  	var reducedPoints = [points[0]];

  	for (var i = 1, prev = 0, len = points.length; i < len; i++) {
  		if (_sqDist(points[i], points[prev]) > sqTolerance) {
  			reducedPoints.push(points[i]);
  			prev = i;
  		}
  	}
  	if (prev < len - 1) {
  		reducedPoints.push(points[len - 1]);
  	}
  	return reducedPoints;
  }

  var _lastCode;

  // @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
  // Clips the segment a to b by rectangular bounds with the
  // [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
  // (modifying the segment points directly!). Used by Leaflet to only show polyline
  // points that are on the screen or near, increasing performance.
  function clipSegment(a, b, bounds, useLastCode, round) {
  	var codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
  	    codeB = _getBitCode(b, bounds),

  	    codeOut, p, newCode;

  	    // save 2nd code to avoid calculating it on the next segment
  	    _lastCode = codeB;

  	while (true) {
  		// if a,b is inside the clip window (trivial accept)
  		if (!(codeA | codeB)) {
  			return [a, b];
  		}

  		// if a,b is outside the clip window (trivial reject)
  		if (codeA & codeB) {
  			return false;
  		}

  		// other cases
  		codeOut = codeA || codeB;
  		p = _getEdgeIntersection(a, b, codeOut, bounds, round);
  		newCode = _getBitCode(p, bounds);

  		if (codeOut === codeA) {
  			a = p;
  			codeA = newCode;
  		} else {
  			b = p;
  			codeB = newCode;
  		}
  	}
  }

  function _getEdgeIntersection(a, b, code, bounds, round) {
  	var dx = b.x - a.x,
  	    dy = b.y - a.y,
  	    min = bounds.min,
  	    max = bounds.max,
  	    x, y;

  	if (code & 8) { // top
  		x = a.x + dx * (max.y - a.y) / dy;
  		y = max.y;

  	} else if (code & 4) { // bottom
  		x = a.x + dx * (min.y - a.y) / dy;
  		y = min.y;

  	} else if (code & 2) { // right
  		x = max.x;
  		y = a.y + dy * (max.x - a.x) / dx;

  	} else if (code & 1) { // left
  		x = min.x;
  		y = a.y + dy * (min.x - a.x) / dx;
  	}

  	return new Point(x, y, round);
  }

  function _getBitCode(p, bounds) {
  	var code = 0;

  	if (p.x < bounds.min.x) { // left
  		code |= 1;
  	} else if (p.x > bounds.max.x) { // right
  		code |= 2;
  	}

  	if (p.y < bounds.min.y) { // bottom
  		code |= 4;
  	} else if (p.y > bounds.max.y) { // top
  		code |= 8;
  	}

  	return code;
  }

  // square distance (to avoid unnecessary Math.sqrt calls)
  function _sqDist(p1, p2) {
  	var dx = p2.x - p1.x,
  	    dy = p2.y - p1.y;
  	return dx * dx + dy * dy;
  }

  // return closest point on segment or distance to that point
  function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
  	var x = p1.x,
  	    y = p1.y,
  	    dx = p2.x - x,
  	    dy = p2.y - y,
  	    dot = dx * dx + dy * dy,
  	    t;

  	if (dot > 0) {
  		t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

  		if (t > 1) {
  			x = p2.x;
  			y = p2.y;
  		} else if (t > 0) {
  			x += dx * t;
  			y += dy * t;
  		}
  	}

  	dx = p.x - x;
  	dy = p.y - y;

  	return sqDist ? dx * dx + dy * dy : new Point(x, y);
  }


  // @function isFlat(latlngs: LatLng[]): Boolean
  // Returns true if `latlngs` is a flat array, false is nested.
  function isFlat(latlngs) {
  	return !isArray(latlngs[0]) || (typeof latlngs[0][0] !== 'object' && typeof latlngs[0][0] !== 'undefined');
  }

  function _flat(latlngs) {
  	console.warn('Deprecated use of _flat, please use L.LineUtil.isFlat instead.');
  	return isFlat(latlngs);
  }

  var LineUtil = ({
    simplify: simplify,
    pointToSegmentDistance: pointToSegmentDistance,
    closestPointOnSegment: closestPointOnSegment,
    clipSegment: clipSegment,
    _getEdgeIntersection: _getEdgeIntersection,
    _getBitCode: _getBitCode,
    _sqClosestPointOnSegment: _sqClosestPointOnSegment,
    isFlat: isFlat,
    _flat: _flat
  });

  /*
   * @namespace PolyUtil
   * Various utility functions for polygon geometries.
   */

  /* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
   * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
   * Used by Leaflet to only show polygon points that are on the screen or near, increasing
   * performance. Note that polygon points needs different algorithm for clipping
   * than polyline, so there's a separate method for it.
   */
  function clipPolygon(points, bounds, round) {
  	var clippedPoints,
  	    edges = [1, 4, 2, 8],
  	    i, j, k,
  	    a, b,
  	    len, edge, p;

  	for (i = 0, len = points.length; i < len; i++) {
  		points[i]._code = _getBitCode(points[i], bounds);
  	}

  	// for each edge (left, bottom, right, top)
  	for (k = 0; k < 4; k++) {
  		edge = edges[k];
  		clippedPoints = [];

  		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
  			a = points[i];
  			b = points[j];

  			// if a is inside the clip window
  			if (!(a._code & edge)) {
  				// if b is outside the clip window (a->b goes out of screen)
  				if (b._code & edge) {
  					p = _getEdgeIntersection(b, a, edge, bounds, round);
  					p._code = _getBitCode(p, bounds);
  					clippedPoints.push(p);
  				}
  				clippedPoints.push(a);

  			// else if b is inside the clip window (a->b enters the screen)
  			} else if (!(b._code & edge)) {
  				p = _getEdgeIntersection(b, a, edge, bounds, round);
  				p._code = _getBitCode(p, bounds);
  				clippedPoints.push(p);
  			}
  		}
  		points = clippedPoints;
  	}

  	return points;
  }

  var PolyUtil = ({
    clipPolygon: clipPolygon
  });

  /*
   * @namespace Projection
   * @section
   * Leaflet comes with a set of already defined Projections out of the box:
   *
   * @projection L.Projection.LonLat
   *
   * Equirectangular, or Plate Carree projection — the most simple projection,
   * mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
   * latitude. Also suitable for flat worlds, e.g. game maps. Used by the
   * `EPSG:4326` and `Simple` CRS.
   */

  var LonLat = {
  	project: function (latlng) {
  		return new Point(latlng.lng, latlng.lat);
  	},

  	unproject: function (point) {
  		return new LatLng(point.y, point.x);
  	},

  	bounds: new Bounds([-180, -90], [180, 90])
  };

  /*
   * @namespace Projection
   * @projection L.Projection.Mercator
   *
   * Elliptical Mercator projection — more complex than Spherical Mercator. Assumes that Earth is an ellipsoid. Used by the EPSG:3395 CRS.
   */

  var Mercator = {
  	R: 6378137,
  	R_MINOR: 6356752.314245179,

  	bounds: new Bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),

  	project: function (latlng) {
  		var d = Math.PI / 180,
  		    r = this.R,
  		    y = latlng.lat * d,
  		    tmp = this.R_MINOR / r,
  		    e = Math.sqrt(1 - tmp * tmp),
  		    con = e * Math.sin(y);

  		var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
  		y = -r * Math.log(Math.max(ts, 1E-10));

  		return new Point(latlng.lng * d * r, y);
  	},

  	unproject: function (point) {
  		var d = 180 / Math.PI,
  		    r = this.R,
  		    tmp = this.R_MINOR / r,
  		    e = Math.sqrt(1 - tmp * tmp),
  		    ts = Math.exp(-point.y / r),
  		    phi = Math.PI / 2 - 2 * Math.atan(ts);

  		for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
  			con = e * Math.sin(phi);
  			con = Math.pow((1 - con) / (1 + con), e / 2);
  			dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
  			phi += dphi;
  		}

  		return new LatLng(phi * d, point.x * d / r);
  	}
  };

  /*
   * @class Projection

   * An object with methods for projecting geographical coordinates of the world onto
   * a flat surface (and back). See [Map projection](http://en.wikipedia.org/wiki/Map_projection).

   * @property bounds: Bounds
   * The bounds (specified in CRS units) where the projection is valid

   * @method project(latlng: LatLng): Point
   * Projects geographical coordinates into a 2D point.
   * Only accepts actual `L.LatLng` instances, not arrays.

   * @method unproject(point: Point): LatLng
   * The inverse of `project`. Projects a 2D point into a geographical location.
   * Only accepts actual `L.Point` instances, not arrays.

   * Note that the projection instances do not inherit from Leaflet's `Class` object,
   * and can't be instantiated. Also, new classes can't inherit from them,
   * and methods can't be added to them with the `include` function.

   */

  var index = ({
    LonLat: LonLat,
    Mercator: Mercator,
    SphericalMercator: SphericalMercator
  });

  /*
   * @namespace CRS
   * @crs L.CRS.EPSG3395
   *
   * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
   */
  var EPSG3395 = extend({}, Earth, {
  	code: 'EPSG:3395',
  	projection: Mercator,

  	transformation: (function () {
  		var scale = 0.5 / (Math.PI * Mercator.R);
  		return toTransformation(scale, 0.5, -scale, 0.5);
  	}())
  });

  /*
   * @namespace CRS
   * @crs L.CRS.EPSG4326
   *
   * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
   *
   * Leaflet 1.0.x complies with the [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic),
   * which is a breaking change from 0.7.x behaviour.  If you are using a `TileLayer`
   * with this CRS, ensure that there are two 256x256 pixel tiles covering the
   * whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90),
   * or (-180,-90) for `TileLayer`s with [the `tms` option](#tilelayer-tms) set.
   */

  var EPSG4326 = extend({}, Earth, {
  	code: 'EPSG:4326',
  	projection: LonLat,
  	transformation: toTransformation(1 / 180, 1, -1 / 180, 0.5)
  });

  /*
   * @namespace CRS
   * @crs L.CRS.Simple
   *
   * A simple CRS that maps longitude and latitude into `x` and `y` directly.
   * May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
   * axis should still be inverted (going from bottom to top). `distance()` returns
   * simple euclidean distance.
   */

  var Simple = extend({}, CRS, {
  	projection: LonLat,
  	transformation: toTransformation(1, 0, -1, 0),

  	scale: function (zoom) {
  		return Math.pow(2, zoom);
  	},

  	zoom: function (scale) {
  		return Math.log(scale) / Math.LN2;
  	},

  	distance: function (latlng1, latlng2) {
  		var dx = latlng2.lng - latlng1.lng,
  		    dy = latlng2.lat - latlng1.lat;

  		return Math.sqrt(dx * dx + dy * dy);
  	},

  	infinite: true
  });

  CRS.Earth = Earth;
  CRS.EPSG3395 = EPSG3395;
  CRS.EPSG3857 = EPSG3857;
  CRS.EPSG900913 = EPSG900913;
  CRS.EPSG4326 = EPSG4326;
  CRS.Simple = Simple;

  /*
   * @class Layer
   * @inherits Evented
   * @aka L.Layer
   * @aka ILayer
   *
   * A set of methods from the Layer base class that all Leaflet layers use.
   * Inherits all methods, options and events from `L.Evented`.
   *
   * @example
   *
   * ```js
   * var layer = L.marker(latlng).addTo(map);
   * layer.addTo(map);
   * layer.remove();
   * ```
   *
   * @event add: Event
   * Fired after the layer is added to a map
   *
   * @event remove: Event
   * Fired after the layer is removed from a map
   */


  var Layer = Evented.extend({

  	// Classes extending `L.Layer` will inherit the following options:
  	options: {
  		// @option pane: String = 'overlayPane'
  		// By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
  		pane: 'overlayPane',

  		// @option attribution: String = null
  		// String to be shown in the attribution control, e.g. "© OpenStreetMap contributors". It describes the layer data and is often a legal obligation towards copyright holders and tile providers.
  		attribution: null,

  		bubblingMouseEvents: true
  	},

  	/* @section
  	 * Classes extending `L.Layer` will inherit the following methods:
  	 *
  	 * @method addTo(map: Map|LayerGroup): this
  	 * Adds the layer to the given map or layer group.
  	 */
  	addTo: function (map) {
  		map.addLayer(this);
  		return this;
  	},

  	// @method remove: this
  	// Removes the layer from the map it is currently active on.
  	remove: function () {
  		return this.removeFrom(this._map || this._mapToAdd);
  	},

  	// @method removeFrom(map: Map): this
  	// Removes the layer from the given map
  	//
  	// @alternative
  	// @method removeFrom(group: LayerGroup): this
  	// Removes the layer from the given `LayerGroup`
  	removeFrom: function (obj) {
  		if (obj) {
  			obj.removeLayer(this);
  		}
  		return this;
  	},

  	// @method getPane(name? : String): HTMLElement
  	// Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
  	getPane: function (name) {
  		return this._map.getPane(name ? (this.options[name] || name) : this.options.pane);
  	},

  	addInteractiveTarget: function (targetEl) {
  		this._map._targets[stamp(targetEl)] = this;
  		return this;
  	},

  	removeInteractiveTarget: function (targetEl) {
  		delete this._map._targets[stamp(targetEl)];
  		return this;
  	},

  	// @method getAttribution: String
  	// Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
  	getAttribution: function () {
  		return this.options.attribution;
  	},

  	_layerAdd: function (e) {
  		var map = e.target;

  		// check in case layer gets added and then removed before the map is ready
  		if (!map.hasLayer(this)) { return; }

  		this._map = map;
  		this._zoomAnimated = map._zoomAnimated;

  		if (this.getEvents) {
  			var events = this.getEvents();
  			map.on(events, this);
  			this.once('remove', function () {
  				map.off(events, this);
  			}, this);
  		}

  		this.onAdd(map);

  		if (this.getAttribution && map.attributionControl) {
  			map.attributionControl.addAttribution(this.getAttribution());
  		}

  		this.fire('add');
  		map.fire('layeradd', {layer: this});
  	}
  });

  /* @section Extension methods
   * @uninheritable
   *
   * Every layer should extend from `L.Layer` and (re-)implement the following methods.
   *
   * @method onAdd(map: Map): this
   * Should contain code that creates DOM elements for the layer, adds them to `map panes` where they should belong and puts listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
   *
   * @method onRemove(map: Map): this
   * Should contain all clean up code that removes the layer's elements from the DOM and removes listeners previously added in [`onAdd`](#layer-onadd). Called on [`map.removeLayer(layer)`](#map-removelayer).
   *
   * @method getEvents(): Object
   * This optional method should return an object like `{ viewreset: this._reset }` for [`addEventListener`](#evented-addeventlistener). The event handlers in this object will be automatically added and removed from the map with your layer.
   *
   * @method getAttribution(): String
   * This optional method should return a string containing HTML to be shown on the `Attribution control` whenever the layer is visible.
   *
   * @method beforeAdd(map: Map): this
   * Optional method. Called on [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before events are initialized, without waiting until the map is in a usable state. Use for early initialization only.
   */


  /* @namespace Map
   * @section Layer events
   *
   * @event layeradd: LayerEvent
   * Fired when a new layer is added to the map.
   *
   * @event layerremove: LayerEvent
   * Fired when some layer is removed from the map
   *
   * @section Methods for Layers and Controls
   */
  Map.include({
  	// @method addLayer(layer: Layer): this
  	// Adds the given layer to the map
  	addLayer: function (layer) {
  		if (!layer._layerAdd) {
  			throw new Error('The provided object is not a Layer.');
  		}

  		var id = stamp(layer);
  		if (this._layers[id]) { return this; }
  		this._layers[id] = layer;

  		layer._mapToAdd = this;

  		if (layer.beforeAdd) {
  			layer.beforeAdd(this);
  		}

  		this.whenReady(layer._layerAdd, layer);

  		return this;
  	},

  	// @method removeLayer(layer: Layer): this
  	// Removes the given layer from the map.
  	removeLayer: function (layer) {
  		var id = stamp(layer);

  		if (!this._layers[id]) { return this; }

  		if (this._loaded) {
  			layer.onRemove(this);
  		}

  		if (layer.getAttribution && this.attributionControl) {
  			this.attributionControl.removeAttribution(layer.getAttribution());
  		}

  		delete this._layers[id];

  		if (this._loaded) {
  			this.fire('layerremove', {layer: layer});
  			layer.fire('remove');
  		}

  		layer._map = layer._mapToAdd = null;

  		return this;
  	},

  	// @method hasLayer(layer: Layer): Boolean
  	// Returns `true` if the given layer is currently added to the map
  	hasLayer: function (layer) {
  		return !!layer && (stamp(layer) in this._layers);
  	},

  	/* @method eachLayer(fn: Function, context?: Object): this
  	 * Iterates over the layers of the map, optionally specifying context of the iterator function.
  	 * ```
  	 * map.eachLayer(function(layer){
  	 *     layer.bindPopup('Hello');
  	 * });
  	 * ```
  	 */
  	eachLayer: function (method, context) {
  		for (var i in this._layers) {
  			method.call(context, this._layers[i]);
  		}
  		return this;
  	},

  	_addLayers: function (layers) {
  		layers = layers ? (isArray(layers) ? layers : [layers]) : [];

  		for (var i = 0, len = layers.length; i < len; i++) {
  			this.addLayer(layers[i]);
  		}
  	},

  	_addZoomLimit: function (layer) {
  		if (isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
  			this._zoomBoundLayers[stamp(layer)] = layer;
  			this._updateZoomLevels();
  		}
  	},

  	_removeZoomLimit: function (layer) {
  		var id = stamp(layer);

  		if (this._zoomBoundLayers[id]) {
  			delete this._zoomBoundLayers[id];
  			this._updateZoomLevels();
  		}
  	},

  	_updateZoomLevels: function () {
  		var minZoom = Infinity,
  		    maxZoom = -Infinity,
  		    oldZoomSpan = this._getZoomSpan();

  		for (var i in this._zoomBoundLayers) {
  			var options = this._zoomBoundLayers[i].options;

  			minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom);
  			maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom);
  		}

  		this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
  		this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

  		// @section Map state change events
  		// @event zoomlevelschange: Event
  		// Fired when the number of zoomlevels on the map is changed due
  		// to adding or removing a layer.
  		if (oldZoomSpan !== this._getZoomSpan()) {
  			this.fire('zoomlevelschange');
  		}

  		if (this.options.maxZoom === undefined && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
  			this.setZoom(this._layersMaxZoom);
  		}
  		if (this.options.minZoom === undefined && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
  			this.setZoom(this._layersMinZoom);
  		}
  	}
  });

  /*
   * @class LayerGroup
   * @aka L.LayerGroup
   * @inherits Layer
   *
   * Used to group several layers and handle them as one. If you add it to the map,
   * any layers added or removed from the group will be added/removed on the map as
   * well. Extends `Layer`.
   *
   * @example
   *
   * ```js
   * L.layerGroup([marker1, marker2])
   * 	.addLayer(polyline)
   * 	.addTo(map);
   * ```
   */

  var LayerGroup = Layer.extend({

  	initialize: function (layers, options) {
  		setOptions(this, options);

  		this._layers = {};

  		var i, len;

  		if (layers) {
  			for (i = 0, len = layers.length; i < len; i++) {
  				this.addLayer(layers[i]);
  			}
  		}
  	},

  	// @method addLayer(layer: Layer): this
  	// Adds the given layer to the group.
  	addLayer: function (layer) {
  		var id = this.getLayerId(layer);

  		this._layers[id] = layer;

  		if (this._map) {
  			this._map.addLayer(layer);
  		}

  		return this;
  	},

  	// @method removeLayer(layer: Layer): this
  	// Removes the given layer from the group.
  	// @alternative
  	// @method removeLayer(id: Number): this
  	// Removes the layer with the given internal ID from the group.
  	removeLayer: function (layer) {
  		var id = layer in this._layers ? layer : this.getLayerId(layer);

  		if (this._map && this._layers[id]) {
  			this._map.removeLayer(this._layers[id]);
  		}

  		delete this._layers[id];

  		return this;
  	},

  	// @method hasLayer(layer: Layer): Boolean
  	// Returns `true` if the given layer is currently added to the group.
  	// @alternative
  	// @method hasLayer(id: Number): Boolean
  	// Returns `true` if the given internal ID is currently added to the group.
  	hasLayer: function (layer) {
  		if (!layer) { return false; }
  		var layerId = typeof layer === 'number' ? layer : this.getLayerId(layer);
  		return layerId in this._layers;
  	},

  	// @method clearLayers(): this
  	// Removes all the layers from the group.
  	clearLayers: function () {
  		return this.eachLayer(this.removeLayer, this);
  	},

  	// @method invoke(methodName: String, …): this
  	// Calls `methodName` on every layer contained in this group, passing any
  	// additional parameters. Has no effect if the layers contained do not
  	// implement `methodName`.
  	invoke: function (methodName) {
  		var args = Array.prototype.slice.call(arguments, 1),
  		    i, layer;

  		for (i in this._layers) {
  			layer = this._layers[i];

  			if (layer[methodName]) {
  				layer[methodName].apply(layer, args);
  			}
  		}

  		return this;
  	},

  	onAdd: function (map) {
  		this.eachLayer(map.addLayer, map);
  	},

  	onRemove: function (map) {
  		this.eachLayer(map.removeLayer, map);
  	},

  	// @method eachLayer(fn: Function, context?: Object): this
  	// Iterates over the layers of the group, optionally specifying context of the iterator function.
  	// ```js
  	// group.eachLayer(function (layer) {
  	// 	layer.bindPopup('Hello');
  	// });
  	// ```
  	eachLayer: function (method, context) {
  		for (var i in this._layers) {
  			method.call(context, this._layers[i]);
  		}
  		return this;
  	},

  	// @method getLayer(id: Number): Layer
  	// Returns the layer with the given internal ID.
  	getLayer: function (id) {
  		return this._layers[id];
  	},

  	// @method getLayers(): Layer[]
  	// Returns an array of all the layers added to the group.
  	getLayers: function () {
  		var layers = [];
  		this.eachLayer(layers.push, layers);
  		return layers;
  	},

  	// @method setZIndex(zIndex: Number): this
  	// Calls `setZIndex` on every layer contained in this group, passing the z-index.
  	setZIndex: function (zIndex) {
  		return this.invoke('setZIndex', zIndex);
  	},

  	// @method getLayerId(layer: Layer): Number
  	// Returns the internal ID for a layer
  	getLayerId: function (layer) {
  		return stamp(layer);
  	}
  });


  // @factory L.layerGroup(layers?: Layer[], options?: Object)
  // Create a layer group, optionally given an initial set of layers and an `options` object.
  var layerGroup = function (layers, options) {
  	return new LayerGroup(layers, options);
  };

  /*
   * @class FeatureGroup
   * @aka L.FeatureGroup
   * @inherits LayerGroup
   *
   * Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
   *  * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once (likewise with [`bindTooltip`](#layer-bindtooltip))
   *  * Events are propagated to the `FeatureGroup`, so if the group has an event
   * handler, it will handle events from any of the layers. This includes mouse events
   * and custom events.
   *  * Has `layeradd` and `layerremove` events
   *
   * @example
   *
   * ```js
   * L.featureGroup([marker1, marker2, polyline])
   * 	.bindPopup('Hello world!')
   * 	.on('click', function() { alert('Clicked on a member of the group!'); })
   * 	.addTo(map);
   * ```
   */

  var FeatureGroup = LayerGroup.extend({

  	addLayer: function (layer) {
  		if (this.hasLayer(layer)) {
  			return this;
  		}

  		layer.addEventParent(this);

  		LayerGroup.prototype.addLayer.call(this, layer);

  		// @event layeradd: LayerEvent
  		// Fired when a layer is added to this `FeatureGroup`
  		return this.fire('layeradd', {layer: layer});
  	},

  	removeLayer: function (layer) {
  		if (!this.hasLayer(layer)) {
  			return this;
  		}
  		if (layer in this._layers) {
  			layer = this._layers[layer];
  		}

  		layer.removeEventParent(this);

  		LayerGroup.prototype.removeLayer.call(this, layer);

  		// @event layerremove: LayerEvent
  		// Fired when a layer is removed from this `FeatureGroup`
  		return this.fire('layerremove', {layer: layer});
  	},

  	// @method setStyle(style: Path options): this
  	// Sets the given path options to each layer of the group that has a `setStyle` method.
  	setStyle: function (style) {
  		return this.invoke('setStyle', style);
  	},

  	// @method bringToFront(): this
  	// Brings the layer group to the top of all other layers
  	bringToFront: function () {
  		return this.invoke('bringToFront');
  	},

  	// @method bringToBack(): this
  	// Brings the layer group to the back of all other layers
  	bringToBack: function () {
  		return this.invoke('bringToBack');
  	},

  	// @method getBounds(): LatLngBounds
  	// Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
  	getBounds: function () {
  		var bounds = new LatLngBounds();

  		for (var id in this._layers) {
  			var layer = this._layers[id];
  			bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
  		}
  		return bounds;
  	}
  });

  // @factory L.featureGroup(layers?: Layer[], options?: Object)
  // Create a feature group, optionally given an initial set of layers and an `options` object.
  var featureGroup = function (layers, options) {
  	return new FeatureGroup(layers, options);
  };

  /*
   * @class Icon
   * @aka L.Icon
   *
   * Represents an icon to provide when creating a marker.
   *
   * @example
   *
   * ```js
   * var myIcon = L.icon({
   *     iconUrl: 'my-icon.png',
   *     iconRetinaUrl: 'my-icon@2x.png',
   *     iconSize: [38, 95],
   *     iconAnchor: [22, 94],
   *     popupAnchor: [-3, -76],
   *     shadowUrl: 'my-icon-shadow.png',
   *     shadowRetinaUrl: 'my-icon-shadow@2x.png',
   *     shadowSize: [68, 95],
   *     shadowAnchor: [22, 94]
   * });
   *
   * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
   * ```
   *
   * `L.Icon.Default` extends `L.Icon` and is the blue icon Leaflet uses for markers by default.
   *
   */

  var Icon = Class.extend({

  	/* @section
  	 * @aka Icon options
  	 *
  	 * @option iconUrl: String = null
  	 * **(required)** The URL to the icon image (absolute or relative to your script path).
  	 *
  	 * @option iconRetinaUrl: String = null
  	 * The URL to a retina sized version of the icon image (absolute or relative to your
  	 * script path). Used for Retina screen devices.
  	 *
  	 * @option iconSize: Point = null
  	 * Size of the icon image in pixels.
  	 *
  	 * @option iconAnchor: Point = null
  	 * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
  	 * will be aligned so that this point is at the marker's geographical location. Centered
  	 * by default if size is specified, also can be set in CSS with negative margins.
  	 *
  	 * @option popupAnchor: Point = [0, 0]
  	 * The coordinates of the point from which popups will "open", relative to the icon anchor.
  	 *
  	 * @option tooltipAnchor: Point = [0, 0]
  	 * The coordinates of the point from which tooltips will "open", relative to the icon anchor.
  	 *
  	 * @option shadowUrl: String = null
  	 * The URL to the icon shadow image. If not specified, no shadow image will be created.
  	 *
  	 * @option shadowRetinaUrl: String = null
  	 *
  	 * @option shadowSize: Point = null
  	 * Size of the shadow image in pixels.
  	 *
  	 * @option shadowAnchor: Point = null
  	 * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
  	 * as iconAnchor if not specified).
  	 *
  	 * @option className: String = ''
  	 * A custom class name to assign to both icon and shadow images. Empty by default.
  	 */

  	options: {
  		popupAnchor: [0, 0],
  		tooltipAnchor: [0, 0]
  	},

  	initialize: function (options) {
  		setOptions(this, options);
  	},

  	// @method createIcon(oldIcon?: HTMLElement): HTMLElement
  	// Called internally when the icon has to be shown, returns a `<img>` HTML element
  	// styled according to the options.
  	createIcon: function (oldIcon) {
  		return this._createIcon('icon', oldIcon);
  	},

  	// @method createShadow(oldIcon?: HTMLElement): HTMLElement
  	// As `createIcon`, but for the shadow beneath it.
  	createShadow: function (oldIcon) {
  		return this._createIcon('shadow', oldIcon);
  	},

  	_createIcon: function (name, oldIcon) {
  		var src = this._getIconUrl(name);

  		if (!src) {
  			if (name === 'icon') {
  				throw new Error('iconUrl not set in Icon options (see the docs).');
  			}
  			return null;
  		}

  		var img = this._createImg(src, oldIcon && oldIcon.tagName === 'IMG' ? oldIcon : null);
  		this._setIconStyles(img, name);

  		return img;
  	},

  	_setIconStyles: function (img, name) {
  		var options = this.options;
  		var sizeOption = options[name + 'Size'];

  		if (typeof sizeOption === 'number') {
  			sizeOption = [sizeOption, sizeOption];
  		}

  		var size = toPoint(sizeOption),
  		    anchor = toPoint(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
  		            size && size.divideBy(2, true));

  		img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

  		if (anchor) {
  			img.style.marginLeft = (-anchor.x) + 'px';
  			img.style.marginTop  = (-anchor.y) + 'px';
  		}

  		if (size) {
  			img.style.width  = size.x + 'px';
  			img.style.height = size.y + 'px';
  		}
  	},

  	_createImg: function (src, el) {
  		el = el || document.createElement('img');
  		el.src = src;
  		return el;
  	},

  	_getIconUrl: function (name) {
  		return retina && this.options[name + 'RetinaUrl'] || this.options[name + 'Url'];
  	}
  });


  // @factory L.icon(options: Icon options)
  // Creates an icon instance with the given options.
  function icon(options) {
  	return new Icon(options);
  }

  /*
   * @miniclass Icon.Default (Icon)
   * @aka L.Icon.Default
   * @section
   *
   * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
   * no icon is specified. Points to the blue marker image distributed with Leaflet
   * releases.
   *
   * In order to customize the default icon, just change the properties of `L.Icon.Default.prototype.options`
   * (which is a set of `Icon options`).
   *
   * If you want to _completely_ replace the default icon, override the
   * `L.Marker.prototype.options.icon` with your own icon instead.
   */

  var IconDefault = Icon.extend({

  	options: {
  		iconUrl:       'marker-icon.png',
  		iconRetinaUrl: 'marker-icon-2x.png',
  		shadowUrl:     'marker-shadow.png',
  		iconSize:    [25, 41],
  		iconAnchor:  [12, 41],
  		popupAnchor: [1, -34],
  		tooltipAnchor: [16, -28],
  		shadowSize:  [41, 41]
  	},

  	_getIconUrl: function (name) {
  		if (!IconDefault.imagePath) {	// Deprecated, backwards-compatibility only
  			IconDefault.imagePath = this._detectIconPath();
  		}

  		// @option imagePath: String
  		// `Icon.Default` will try to auto-detect the location of the
  		// blue icon images. If you are placing these images in a non-standard
  		// way, set this option to point to the right path.
  		return (this.options.imagePath || IconDefault.imagePath) + Icon.prototype._getIconUrl.call(this, name);
  	},

  	_detectIconPath: function () {
  		var el = create$1('div',  'leaflet-default-icon-path', document.body);
  		var path = getStyle(el, 'background-image') ||
  		           getStyle(el, 'backgroundImage');	// IE8

  		document.body.removeChild(el);

  		if (path === null || path.indexOf('url') !== 0) {
  			path = '';
  		} else {
  			path = path.replace(/^url\(["']?/, '').replace(/marker-icon\.png["']?\)$/, '');
  		}

  		return path;
  	}
  });

  /*
   * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
   */


  /* @namespace Marker
   * @section Interaction handlers
   *
   * Interaction handlers are properties of a marker instance that allow you to control interaction behavior in runtime, enabling or disabling certain features such as dragging (see `Handler` methods). Example:
   *
   * ```js
   * marker.dragging.disable();
   * ```
   *
   * @property dragging: Handler
   * Marker dragging handler (by both mouse and touch). Only valid when the marker is on the map (Otherwise set [`marker.options.draggable`](#marker-draggable)).
   */

  var MarkerDrag = Handler.extend({
  	initialize: function (marker) {
  		this._marker = marker;
  	},

  	addHooks: function () {
  		var icon = this._marker._icon;

  		if (!this._draggable) {
  			this._draggable = new Draggable(icon, icon, true);
  		}

  		this._draggable.on({
  			dragstart: this._onDragStart,
  			predrag: this._onPreDrag,
  			drag: this._onDrag,
  			dragend: this._onDragEnd
  		}, this).enable();

  		addClass(icon, 'leaflet-marker-draggable');
  	},

  	removeHooks: function () {
  		this._draggable.off({
  			dragstart: this._onDragStart,
  			predrag: this._onPreDrag,
  			drag: this._onDrag,
  			dragend: this._onDragEnd
  		}, this).disable();

  		if (this._marker._icon) {
  			removeClass(this._marker._icon, 'leaflet-marker-draggable');
  		}
  	},

  	moved: function () {
  		return this._draggable && this._draggable._moved;
  	},

  	_adjustPan: function (e) {
  		var marker = this._marker,
  		    map = marker._map,
  		    speed = this._marker.options.autoPanSpeed,
  		    padding = this._marker.options.autoPanPadding,
  		    iconPos = getPosition(marker._icon),
  		    bounds = map.getPixelBounds(),
  		    origin = map.getPixelOrigin();

  		var panBounds = toBounds(
  			bounds.min._subtract(origin).add(padding),
  			bounds.max._subtract(origin).subtract(padding)
  		);

  		if (!panBounds.contains(iconPos)) {
  			// Compute incremental movement
  			var movement = toPoint(
  				(Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) -
  				(Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x),

  				(Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) -
  				(Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)
  			).multiplyBy(speed);

  			map.panBy(movement, {animate: false});

  			this._draggable._newPos._add(movement);
  			this._draggable._startPos._add(movement);

  			setPosition(marker._icon, this._draggable._newPos);
  			this._onDrag(e);

  			this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
  		}
  	},

  	_onDragStart: function () {
  		// @section Dragging events
  		// @event dragstart: Event
  		// Fired when the user starts dragging the marker.

  		// @event movestart: Event
  		// Fired when the marker starts moving (because of dragging).

  		this._oldLatLng = this._marker.getLatLng();

  		// When using ES6 imports it could not be set when `Popup` was not imported as well
  		this._marker.closePopup && this._marker.closePopup();

  		this._marker
  			.fire('movestart')
  			.fire('dragstart');
  	},

  	_onPreDrag: function (e) {
  		if (this._marker.options.autoPan) {
  			cancelAnimFrame(this._panRequest);
  			this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
  		}
  	},

  	_onDrag: function (e) {
  		var marker = this._marker,
  		    shadow = marker._shadow,
  		    iconPos = getPosition(marker._icon),
  		    latlng = marker._map.layerPointToLatLng(iconPos);

  		// update shadow position
  		if (shadow) {
  			setPosition(shadow, iconPos);
  		}

  		marker._latlng = latlng;
  		e.latlng = latlng;
  		e.oldLatLng = this._oldLatLng;

  		// @event drag: Event
  		// Fired repeatedly while the user drags the marker.
  		marker
  		    .fire('move', e)
  		    .fire('drag', e);
  	},

  	_onDragEnd: function (e) {
  		// @event dragend: DragEndEvent
  		// Fired when the user stops dragging the marker.

  		 cancelAnimFrame(this._panRequest);

  		// @event moveend: Event
  		// Fired when the marker stops moving (because of dragging).
  		delete this._oldLatLng;
  		this._marker
  		    .fire('moveend')
  		    .fire('dragend', e);
  	}
  });

  /*
   * @class Marker
   * @inherits Interactive layer
   * @aka L.Marker
   * L.Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
   *
   * @example
   *
   * ```js
   * L.marker([50.5, 30.5]).addTo(map);
   * ```
   */

  var Marker = Layer.extend({

  	// @section
  	// @aka Marker options
  	options: {
  		// @option icon: Icon = *
  		// Icon instance to use for rendering the marker.
  		// See [Icon documentation](#L.Icon) for details on how to customize the marker icon.
  		// If not specified, a common instance of `L.Icon.Default` is used.
  		icon: new IconDefault(),

  		// Option inherited from "Interactive layer" abstract class
  		interactive: true,

  		// @option keyboard: Boolean = true
  		// Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
  		keyboard: true,

  		// @option title: String = ''
  		// Text for the browser tooltip that appear on marker hover (no tooltip by default).
  		title: '',

  		// @option alt: String = ''
  		// Text for the `alt` attribute of the icon image (useful for accessibility).
  		alt: '',

  		// @option zIndexOffset: Number = 0
  		// By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
  		zIndexOffset: 0,

  		// @option opacity: Number = 1.0
  		// The opacity of the marker.
  		opacity: 1,

  		// @option riseOnHover: Boolean = false
  		// If `true`, the marker will get on top of others when you hover the mouse over it.
  		riseOnHover: false,

  		// @option riseOffset: Number = 250
  		// The z-index offset used for the `riseOnHover` feature.
  		riseOffset: 250,

  		// @option pane: String = 'markerPane'
  		// `Map pane` where the markers icon will be added.
  		pane: 'markerPane',

  		// @option shadowPane: String = 'shadowPane'
  		// `Map pane` where the markers shadow will be added.
  		shadowPane: 'shadowPane',

  		// @option bubblingMouseEvents: Boolean = false
  		// When `true`, a mouse event on this marker will trigger the same event on the map
  		// (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
  		bubblingMouseEvents: false,

  		// @section Draggable marker options
  		// @option draggable: Boolean = false
  		// Whether the marker is draggable with mouse/touch or not.
  		draggable: false,

  		// @option autoPan: Boolean = false
  		// Whether to pan the map when dragging this marker near its edge or not.
  		autoPan: false,

  		// @option autoPanPadding: Point = Point(50, 50)
  		// Distance (in pixels to the left/right and to the top/bottom) of the
  		// map edge to start panning the map.
  		autoPanPadding: [50, 50],

  		// @option autoPanSpeed: Number = 10
  		// Number of pixels the map should pan by.
  		autoPanSpeed: 10
  	},

  	/* @section
  	 *
  	 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
  	 */

  	initialize: function (latlng, options) {
  		setOptions(this, options);
  		this._latlng = toLatLng(latlng);
  	},

  	onAdd: function (map) {
  		this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

  		if (this._zoomAnimated) {
  			map.on('zoomanim', this._animateZoom, this);
  		}

  		this._initIcon();
  		this.update();
  	},

  	onRemove: function (map) {
  		if (this.dragging && this.dragging.enabled()) {
  			this.options.draggable = true;
  			this.dragging.removeHooks();
  		}
  		delete this.dragging;

  		if (this._zoomAnimated) {
  			map.off('zoomanim', this._animateZoom, this);
  		}

  		this._removeIcon();
  		this._removeShadow();
  	},

  	getEvents: function () {
  		return {
  			zoom: this.update,
  			viewreset: this.update
  		};
  	},

  	// @method getLatLng: LatLng
  	// Returns the current geographical position of the marker.
  	getLatLng: function () {
  		return this._latlng;
  	},

  	// @method setLatLng(latlng: LatLng): this
  	// Changes the marker position to the given point.
  	setLatLng: function (latlng) {
  		var oldLatLng = this._latlng;
  		this._latlng = toLatLng(latlng);
  		this.update();

  		// @event move: Event
  		// Fired when the marker is moved via [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
  		return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
  	},

  	// @method setZIndexOffset(offset: Number): this
  	// Changes the [zIndex offset](#marker-zindexoffset) of the marker.
  	setZIndexOffset: function (offset) {
  		this.options.zIndexOffset = offset;
  		return this.update();
  	},

  	// @method getIcon: Icon
  	// Returns the current icon used by the marker
  	getIcon: function () {
  		return this.options.icon;
  	},

  	// @method setIcon(icon: Icon): this
  	// Changes the marker icon.
  	setIcon: function (icon) {

  		this.options.icon = icon;

  		if (this._map) {
  			this._initIcon();
  			this.update();
  		}

  		if (this._popup) {
  			this.bindPopup(this._popup, this._popup.options);
  		}

  		return this;
  	},

  	getElement: function () {
  		return this._icon;
  	},

  	update: function () {

  		if (this._icon && this._map) {
  			var pos = this._map.latLngToLayerPoint(this._latlng).round();
  			this._setPos(pos);
  		}

  		return this;
  	},

  	_initIcon: function () {
  		var options = this.options,
  		    classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

  		var icon = options.icon.createIcon(this._icon),
  		    addIcon = false;

  		// if we're not reusing the icon, remove the old one and init new one
  		if (icon !== this._icon) {
  			if (this._icon) {
  				this._removeIcon();
  			}
  			addIcon = true;

  			if (options.title) {
  				icon.title = options.title;
  			}

  			if (icon.tagName === 'IMG') {
  				icon.alt = options.alt || '';
  			}
  		}

  		addClass(icon, classToAdd);

  		if (options.keyboard) {
  			icon.tabIndex = '0';
  		}

  		this._icon = icon;

  		if (options.riseOnHover) {
  			this.on({
  				mouseover: this._bringToFront,
  				mouseout: this._resetZIndex
  			});
  		}

  		var newShadow = options.icon.createShadow(this._shadow),
  		    addShadow = false;

  		if (newShadow !== this._shadow) {
  			this._removeShadow();
  			addShadow = true;
  		}

  		if (newShadow) {
  			addClass(newShadow, classToAdd);
  			newShadow.alt = '';
  		}
  		this._shadow = newShadow;


  		if (options.opacity < 1) {
  			this._updateOpacity();
  		}


  		if (addIcon) {
  			this.getPane().appendChild(this._icon);
  		}
  		this._initInteraction();
  		if (newShadow && addShadow) {
  			this.getPane(options.shadowPane).appendChild(this._shadow);
  		}
  	},

  	_removeIcon: function () {
  		if (this.options.riseOnHover) {
  			this.off({
  				mouseover: this._bringToFront,
  				mouseout: this._resetZIndex
  			});
  		}

  		remove(this._icon);
  		this.removeInteractiveTarget(this._icon);

  		this._icon = null;
  	},

  	_removeShadow: function () {
  		if (this._shadow) {
  			remove(this._shadow);
  		}
  		this._shadow = null;
  	},

  	_setPos: function (pos) {

  		if (this._icon) {
  			setPosition(this._icon, pos);
  		}

  		if (this._shadow) {
  			setPosition(this._shadow, pos);
  		}

  		this._zIndex = pos.y + this.options.zIndexOffset;

  		this._resetZIndex();
  	},

  	_updateZIndex: function (offset) {
  		if (this._icon) {
  			this._icon.style.zIndex = this._zIndex + offset;
  		}
  	},

  	_animateZoom: function (opt) {
  		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

  		this._setPos(pos);
  	},

  	_initInteraction: function () {

  		if (!this.options.interactive) { return; }

  		addClass(this._icon, 'leaflet-interactive');

  		this.addInteractiveTarget(this._icon);

  		if (MarkerDrag) {
  			var draggable = this.options.draggable;
  			if (this.dragging) {
  				draggable = this.dragging.enabled();
  				this.dragging.disable();
  			}

  			this.dragging = new MarkerDrag(this);

  			if (draggable) {
  				this.dragging.enable();
  			}
  		}
  	},

  	// @method setOpacity(opacity: Number): this
  	// Changes the opacity of the marker.
  	setOpacity: function (opacity) {
  		this.options.opacity = opacity;
  		if (this._map) {
  			this._updateOpacity();
  		}

  		return this;
  	},

  	_updateOpacity: function () {
  		var opacity = this.options.opacity;

  		if (this._icon) {
  			setOpacity(this._icon, opacity);
  		}

  		if (this._shadow) {
  			setOpacity(this._shadow, opacity);
  		}
  	},

  	_bringToFront: function () {
  		this._updateZIndex(this.options.riseOffset);
  	},

  	_resetZIndex: function () {
  		this._updateZIndex(0);
  	},

  	_getPopupAnchor: function () {
  		return this.options.icon.options.popupAnchor;
  	},

  	_getTooltipAnchor: function () {
  		return this.options.icon.options.tooltipAnchor;
  	}
  });


  // factory L.marker(latlng: LatLng, options? : Marker options)

  // @factory L.marker(latlng: LatLng, options? : Marker options)
  // Instantiates a Marker object given a geographical point and optionally an options object.
  function marker(latlng, options) {
  	return new Marker(latlng, options);
  }

  /*
   * @class Path
   * @aka L.Path
   * @inherits Interactive layer
   *
   * An abstract class that contains options and constants shared between vector
   * overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
   */

  var Path = Layer.extend({

  	// @section
  	// @aka Path options
  	options: {
  		// @option stroke: Boolean = true
  		// Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
  		stroke: true,

  		// @option color: String = '#3388ff'
  		// Stroke color
  		color: '#3388ff',

  		// @option weight: Number = 3
  		// Stroke width in pixels
  		weight: 3,

  		// @option opacity: Number = 1.0
  		// Stroke opacity
  		opacity: 1,

  		// @option lineCap: String= 'round'
  		// A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
  		lineCap: 'round',

  		// @option lineJoin: String = 'round'
  		// A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
  		lineJoin: 'round',

  		// @option dashArray: String = null
  		// A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
  		dashArray: null,

  		// @option dashOffset: String = null
  		// A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
  		dashOffset: null,

  		// @option fill: Boolean = depends
  		// Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
  		fill: false,

  		// @option fillColor: String = *
  		// Fill color. Defaults to the value of the [`color`](#path-color) option
  		fillColor: null,

  		// @option fillOpacity: Number = 0.2
  		// Fill opacity.
  		fillOpacity: 0.2,

  		// @option fillRule: String = 'evenodd'
  		// A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
  		fillRule: 'evenodd',

  		// className: '',

  		// Option inherited from "Interactive layer" abstract class
  		interactive: true,

  		// @option bubblingMouseEvents: Boolean = true
  		// When `true`, a mouse event on this path will trigger the same event on the map
  		// (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
  		bubblingMouseEvents: true
  	},

  	beforeAdd: function (map) {
  		// Renderer is set here because we need to call renderer.getEvents
  		// before this.getEvents.
  		this._renderer = map.getRenderer(this);
  	},

  	onAdd: function () {
  		this._renderer._initPath(this);
  		this._reset();
  		this._renderer._addPath(this);
  	},

  	onRemove: function () {
  		this._renderer._removePath(this);
  	},

  	// @method redraw(): this
  	// Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
  	redraw: function () {
  		if (this._map) {
  			this._renderer._updatePath(this);
  		}
  		return this;
  	},

  	// @method setStyle(style: Path options): this
  	// Changes the appearance of a Path based on the options in the `Path options` object.
  	setStyle: function (style) {
  		setOptions(this, style);
  		if (this._renderer) {
  			this._renderer._updateStyle(this);
  			if (this.options.stroke && style && Object.prototype.hasOwnProperty.call(style, 'weight')) {
  				this._updateBounds();
  			}
  		}
  		return this;
  	},

  	// @method bringToFront(): this
  	// Brings the layer to the top of all path layers.
  	bringToFront: function () {
  		if (this._renderer) {
  			this._renderer._bringToFront(this);
  		}
  		return this;
  	},

  	// @method bringToBack(): this
  	// Brings the layer to the bottom of all path layers.
  	bringToBack: function () {
  		if (this._renderer) {
  			this._renderer._bringToBack(this);
  		}
  		return this;
  	},

  	getElement: function () {
  		return this._path;
  	},

  	_reset: function () {
  		// defined in child classes
  		this._project();
  		this._update();
  	},

  	_clickTolerance: function () {
  		// used when doing hit detection for Canvas layers
  		return (this.options.stroke ? this.options.weight / 2 : 0) + this._renderer.options.tolerance;
  	}
  });

  /*
   * @class CircleMarker
   * @aka L.CircleMarker
   * @inherits Path
   *
   * A circle of a fixed size with radius specified in pixels. Extends `Path`.
   */

  var CircleMarker = Path.extend({

  	// @section
  	// @aka CircleMarker options
  	options: {
  		fill: true,

  		// @option radius: Number = 10
  		// Radius of the circle marker, in pixels
  		radius: 10
  	},

  	initialize: function (latlng, options) {
  		setOptions(this, options);
  		this._latlng = toLatLng(latlng);
  		this._radius = this.options.radius;
  	},

  	// @method setLatLng(latLng: LatLng): this
  	// Sets the position of a circle marker to a new location.
  	setLatLng: function (latlng) {
  		var oldLatLng = this._latlng;
  		this._latlng = toLatLng(latlng);
  		this.redraw();

  		// @event move: Event
  		// Fired when the marker is moved via [`setLatLng`](#circlemarker-setlatlng). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
  		return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
  	},

  	// @method getLatLng(): LatLng
  	// Returns the current geographical position of the circle marker
  	getLatLng: function () {
  		return this._latlng;
  	},

  	// @method setRadius(radius: Number): this
  	// Sets the radius of a circle marker. Units are in pixels.
  	setRadius: function (radius) {
  		this.options.radius = this._radius = radius;
  		return this.redraw();
  	},

  	// @method getRadius(): Number
  	// Returns the current radius of the circle
  	getRadius: function () {
  		return this._radius;
  	},

  	setStyle : function (options) {
  		var radius = options && options.radius || this._radius;
  		Path.prototype.setStyle.call(this, options);
  		this.setRadius(radius);
  		return this;
  	},

  	_project: function () {
  		this._point = this._map.latLngToLayerPoint(this._latlng);
  		this._updateBounds();
  	},

  	_updateBounds: function () {
  		var r = this._radius,
  		    r2 = this._radiusY || r,
  		    w = this._clickTolerance(),
  		    p = [r + w, r2 + w];
  		this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
  	},

  	_update: function () {
  		if (this._map) {
  			this._updatePath();
  		}
  	},

  	_updatePath: function () {
  		this._renderer._updateCircle(this);
  	},

  	_empty: function () {
  		return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
  	},

  	// Needed by the `Canvas` renderer for interactivity
  	_containsPoint: function (p) {
  		return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
  	}
  });


  // @factory L.circleMarker(latlng: LatLng, options?: CircleMarker options)
  // Instantiates a circle marker object given a geographical point, and an optional options object.
  function circleMarker(latlng, options) {
  	return new CircleMarker(latlng, options);
  }

  /*
   * @class Circle
   * @aka L.Circle
   * @inherits CircleMarker
   *
   * A class for drawing circle overlays on a map. Extends `CircleMarker`.
   *
   * It's an approximation and starts to diverge from a real circle closer to poles (due to projection distortion).
   *
   * @example
   *
   * ```js
   * L.circle([50.5, 30.5], {radius: 200}).addTo(map);
   * ```
   */

  var Circle = CircleMarker.extend({

  	initialize: function (latlng, options, legacyOptions) {
  		if (typeof options === 'number') {
  			// Backwards compatibility with 0.7.x factory (latlng, radius, options?)
  			options = extend({}, legacyOptions, {radius: options});
  		}
  		setOptions(this, options);
  		this._latlng = toLatLng(latlng);

  		if (isNaN(this.options.radius)) { throw new Error('Circle radius cannot be NaN'); }

  		// @section
  		// @aka Circle options
  		// @option radius: Number; Radius of the circle, in meters.
  		this._mRadius = this.options.radius;
  	},

  	// @method setRadius(radius: Number): this
  	// Sets the radius of a circle. Units are in meters.
  	setRadius: function (radius) {
  		this._mRadius = radius;
  		return this.redraw();
  	},

  	// @method getRadius(): Number
  	// Returns the current radius of a circle. Units are in meters.
  	getRadius: function () {
  		return this._mRadius;
  	},

  	// @method getBounds(): LatLngBounds
  	// Returns the `LatLngBounds` of the path.
  	getBounds: function () {
  		var half = [this._radius, this._radiusY || this._radius];

  		return new LatLngBounds(
  			this._map.layerPointToLatLng(this._point.subtract(half)),
  			this._map.layerPointToLatLng(this._point.add(half)));
  	},

  	setStyle: Path.prototype.setStyle,

  	_project: function () {

  		var lng = this._latlng.lng,
  		    lat = this._latlng.lat,
  		    map = this._map,
  		    crs = map.options.crs;

  		if (crs.distance === Earth.distance) {
  			var d = Math.PI / 180,
  			    latR = (this._mRadius / Earth.R) / d,
  			    top = map.project([lat + latR, lng]),
  			    bottom = map.project([lat - latR, lng]),
  			    p = top.add(bottom).divideBy(2),
  			    lat2 = map.unproject(p).lat,
  			    lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
  			            (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

  			if (isNaN(lngR) || lngR === 0) {
  				lngR = latR / Math.cos(Math.PI / 180 * lat); // Fallback for edge case, #2425
  			}

  			this._point = p.subtract(map.getPixelOrigin());
  			this._radius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;
  			this._radiusY = p.y - top.y;

  		} else {
  			var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));

  			this._point = map.latLngToLayerPoint(this._latlng);
  			this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
  		}

  		this._updateBounds();
  	}
  });

  // @factory L.circle(latlng: LatLng, options?: Circle options)
  // Instantiates a circle object given a geographical point, and an options object
  // which contains the circle radius.
  // @alternative
  // @factory L.circle(latlng: LatLng, radius: Number, options?: Circle options)
  // Obsolete way of instantiating a circle, for compatibility with 0.7.x code.
  // Do not use in new applications or plugins.
  function circle(latlng, options, legacyOptions) {
  	return new Circle(latlng, options, legacyOptions);
  }

  /*
   * @class Polyline
   * @aka L.Polyline
   * @inherits Path
   *
   * A class for drawing polyline overlays on a map. Extends `Path`.
   *
   * @example
   *
   * ```js
   * // create a red polyline from an array of LatLng points
   * var latlngs = [
   * 	[45.51, -122.68],
   * 	[37.77, -122.43],
   * 	[34.04, -118.2]
   * ];
   *
   * var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
   *
   * // zoom the map to the polyline
   * map.fitBounds(polyline.getBounds());
   * ```
   *
   * You can also pass a multi-dimensional array to represent a `MultiPolyline` shape:
   *
   * ```js
   * // create a red polyline from an array of arrays of LatLng points
   * var latlngs = [
   * 	[[45.51, -122.68],
   * 	 [37.77, -122.43],
   * 	 [34.04, -118.2]],
   * 	[[40.78, -73.91],
   * 	 [41.83, -87.62],
   * 	 [32.76, -96.72]]
   * ];
   * ```
   */


  var Polyline = Path.extend({

  	// @section
  	// @aka Polyline options
  	options: {
  		// @option smoothFactor: Number = 1.0
  		// How much to simplify the polyline on each zoom level. More means
  		// better performance and smoother look, and less means more accurate representation.
  		smoothFactor: 1.0,

  		// @option noClip: Boolean = false
  		// Disable polyline clipping.
  		noClip: false
  	},

  	initialize: function (latlngs, options) {
  		setOptions(this, options);
  		this._setLatLngs(latlngs);
  	},

  	// @method getLatLngs(): LatLng[]
  	// Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
  	getLatLngs: function () {
  		return this._latlngs;
  	},

  	// @method setLatLngs(latlngs: LatLng[]): this
  	// Replaces all the points in the polyline with the given array of geographical points.
  	setLatLngs: function (latlngs) {
  		this._setLatLngs(latlngs);
  		return this.redraw();
  	},

  	// @method isEmpty(): Boolean
  	// Returns `true` if the Polyline has no LatLngs.
  	isEmpty: function () {
  		return !this._latlngs.length;
  	},

  	// @method closestLayerPoint(p: Point): Point
  	// Returns the point closest to `p` on the Polyline.
  	closestLayerPoint: function (p) {
  		var minDistance = Infinity,
  		    minPoint = null,
  		    closest = _sqClosestPointOnSegment,
  		    p1, p2;

  		for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
  			var points = this._parts[j];

  			for (var i = 1, len = points.length; i < len; i++) {
  				p1 = points[i - 1];
  				p2 = points[i];

  				var sqDist = closest(p, p1, p2, true);

  				if (sqDist < minDistance) {
  					minDistance = sqDist;
  					minPoint = closest(p, p1, p2);
  				}
  			}
  		}
  		if (minPoint) {
  			minPoint.distance = Math.sqrt(minDistance);
  		}
  		return minPoint;
  	},

  	// @method getCenter(): LatLng
  	// Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the polyline.
  	getCenter: function () {
  		// throws error when not yet added to map as this center calculation requires projected coordinates
  		if (!this._map) {
  			throw new Error('Must add layer to map before using getCenter()');
  		}

  		var i, halfDist, segDist, dist, p1, p2, ratio,
  		    points = this._rings[0],
  		    len = points.length;

  		if (!len) { return null; }

  		// polyline centroid algorithm; only uses the first ring if there are multiple

  		for (i = 0, halfDist = 0; i < len - 1; i++) {
  			halfDist += points[i].distanceTo(points[i + 1]) / 2;
  		}

  		// The line is so small in the current view that all points are on the same pixel.
  		if (halfDist === 0) {
  			return this._map.layerPointToLatLng(points[0]);
  		}

  		for (i = 0, dist = 0; i < len - 1; i++) {
  			p1 = points[i];
  			p2 = points[i + 1];
  			segDist = p1.distanceTo(p2);
  			dist += segDist;

  			if (dist > halfDist) {
  				ratio = (dist - halfDist) / segDist;
  				return this._map.layerPointToLatLng([
  					p2.x - ratio * (p2.x - p1.x),
  					p2.y - ratio * (p2.y - p1.y)
  				]);
  			}
  		}
  	},

  	// @method getBounds(): LatLngBounds
  	// Returns the `LatLngBounds` of the path.
  	getBounds: function () {
  		return this._bounds;
  	},

  	// @method addLatLng(latlng: LatLng, latlngs?: LatLng[]): this
  	// Adds a given point to the polyline. By default, adds to the first ring of
  	// the polyline in case of a multi-polyline, but can be overridden by passing
  	// a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
  	addLatLng: function (latlng, latlngs) {
  		latlngs = latlngs || this._defaultShape();
  		latlng = toLatLng(latlng);
  		latlngs.push(latlng);
  		this._bounds.extend(latlng);
  		return this.redraw();
  	},

  	_setLatLngs: function (latlngs) {
  		this._bounds = new LatLngBounds();
  		this._latlngs = this._convertLatLngs(latlngs);
  	},

  	_defaultShape: function () {
  		return isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
  	},

  	// recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
  	_convertLatLngs: function (latlngs) {
  		var result = [],
  		    flat = isFlat(latlngs);

  		for (var i = 0, len = latlngs.length; i < len; i++) {
  			if (flat) {
  				result[i] = toLatLng(latlngs[i]);
  				this._bounds.extend(result[i]);
  			} else {
  				result[i] = this._convertLatLngs(latlngs[i]);
  			}
  		}

  		return result;
  	},

  	_project: function () {
  		var pxBounds = new Bounds();
  		this._rings = [];
  		this._projectLatlngs(this._latlngs, this._rings, pxBounds);

  		if (this._bounds.isValid() && pxBounds.isValid()) {
  			this._rawPxBounds = pxBounds;
  			this._updateBounds();
  		}
  	},

  	_updateBounds: function () {
  		var w = this._clickTolerance(),
  		    p = new Point(w, w);
  		this._pxBounds = new Bounds([
  			this._rawPxBounds.min.subtract(p),
  			this._rawPxBounds.max.add(p)
  		]);
  	},

  	// recursively turns latlngs into a set of rings with projected coordinates
  	_projectLatlngs: function (latlngs, result, projectedBounds) {
  		var flat = latlngs[0] instanceof LatLng,
  		    len = latlngs.length,
  		    i, ring;

  		if (flat) {
  			ring = [];
  			for (i = 0; i < len; i++) {
  				ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
  				projectedBounds.extend(ring[i]);
  			}
  			result.push(ring);
  		} else {
  			for (i = 0; i < len; i++) {
  				this._projectLatlngs(latlngs[i], result, projectedBounds);
  			}
  		}
  	},

  	// clip polyline by renderer bounds so that we have less to render for performance
  	_clipPoints: function () {
  		var bounds = this._renderer._bounds;

  		this._parts = [];
  		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
  			return;
  		}

  		if (this.options.noClip) {
  			this._parts = this._rings;
  			return;
  		}

  		var parts = this._parts,
  		    i, j, k, len, len2, segment, points;

  		for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
  			points = this._rings[i];

  			for (j = 0, len2 = points.length; j < len2 - 1; j++) {
  				segment = clipSegment(points[j], points[j + 1], bounds, j, true);

  				if (!segment) { continue; }

  				parts[k] = parts[k] || [];
  				parts[k].push(segment[0]);

  				// if segment goes out of screen, or it's the last one, it's the end of the line part
  				if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
  					parts[k].push(segment[1]);
  					k++;
  				}
  			}
  		}
  	},

  	// simplify each clipped part of the polyline for performance
  	_simplifyPoints: function () {
  		var parts = this._parts,
  		    tolerance = this.options.smoothFactor;

  		for (var i = 0, len = parts.length; i < len; i++) {
  			parts[i] = simplify(parts[i], tolerance);
  		}
  	},

  	_update: function () {
  		if (!this._map) { return; }

  		this._clipPoints();
  		this._simplifyPoints();
  		this._updatePath();
  	},

  	_updatePath: function () {
  		this._renderer._updatePoly(this);
  	},

  	// Needed by the `Canvas` renderer for interactivity
  	_containsPoint: function (p, closed) {
  		var i, j, k, len, len2, part,
  		    w = this._clickTolerance();

  		if (!this._pxBounds || !this._pxBounds.contains(p)) { return false; }

  		// hit detection for polylines
  		for (i = 0, len = this._parts.length; i < len; i++) {
  			part = this._parts[i];

  			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
  				if (!closed && (j === 0)) { continue; }

  				if (pointToSegmentDistance(p, part[k], part[j]) <= w) {
  					return true;
  				}
  			}
  		}
  		return false;
  	}
  });

  // @factory L.polyline(latlngs: LatLng[], options?: Polyline options)
  // Instantiates a polyline object given an array of geographical points and
  // optionally an options object. You can create a `Polyline` object with
  // multiple separate lines (`MultiPolyline`) by passing an array of arrays
  // of geographic points.
  function polyline(latlngs, options) {
  	return new Polyline(latlngs, options);
  }

  // Retrocompat. Allow plugins to support Leaflet versions before and after 1.1.
  Polyline._flat = _flat;

  /*
   * @class Polygon
   * @aka L.Polygon
   * @inherits Polyline
   *
   * A class for drawing polygon overlays on a map. Extends `Polyline`.
   *
   * Note that points you pass when creating a polygon shouldn't have an additional last point equal to the first one — it's better to filter out such points.
   *
   *
   * @example
   *
   * ```js
   * // create a red polygon from an array of LatLng points
   * var latlngs = [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]];
   *
   * var polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
   *
   * // zoom the map to the polygon
   * map.fitBounds(polygon.getBounds());
   * ```
   *
   * You can also pass an array of arrays of latlngs, with the first array representing the outer shape and the other arrays representing holes in the outer shape:
   *
   * ```js
   * var latlngs = [
   *   [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
   *   [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
   * ];
   * ```
   *
   * Additionally, you can pass a multi-dimensional array to represent a MultiPolygon shape.
   *
   * ```js
   * var latlngs = [
   *   [ // first polygon
   *     [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
   *     [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
   *   ],
   *   [ // second polygon
   *     [[41, -111.03],[45, -111.04],[45, -104.05],[41, -104.05]]
   *   ]
   * ];
   * ```
   */

  var Polygon = Polyline.extend({

  	options: {
  		fill: true
  	},

  	isEmpty: function () {
  		return !this._latlngs.length || !this._latlngs[0].length;
  	},

  	getCenter: function () {
  		// throws error when not yet added to map as this center calculation requires projected coordinates
  		if (!this._map) {
  			throw new Error('Must add layer to map before using getCenter()');
  		}

  		var i, j, p1, p2, f, area, x, y, center,
  		    points = this._rings[0],
  		    len = points.length;

  		if (!len) { return null; }

  		// polygon centroid algorithm; only uses the first ring if there are multiple

  		area = x = y = 0;

  		for (i = 0, j = len - 1; i < len; j = i++) {
  			p1 = points[i];
  			p2 = points[j];

  			f = p1.y * p2.x - p2.y * p1.x;
  			x += (p1.x + p2.x) * f;
  			y += (p1.y + p2.y) * f;
  			area += f * 3;
  		}

  		if (area === 0) {
  			// Polygon is so small that all points are on same pixel.
  			center = points[0];
  		} else {
  			center = [x / area, y / area];
  		}
  		return this._map.layerPointToLatLng(center);
  	},

  	_convertLatLngs: function (latlngs) {
  		var result = Polyline.prototype._convertLatLngs.call(this, latlngs),
  		    len = result.length;

  		// remove last point if it equals first one
  		if (len >= 2 && result[0] instanceof LatLng && result[0].equals(result[len - 1])) {
  			result.pop();
  		}
  		return result;
  	},

  	_setLatLngs: function (latlngs) {
  		Polyline.prototype._setLatLngs.call(this, latlngs);
  		if (isFlat(this._latlngs)) {
  			this._latlngs = [this._latlngs];
  		}
  	},

  	_defaultShape: function () {
  		return isFlat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
  	},

  	_clipPoints: function () {
  		// polygons need a different clipping algorithm so we redefine that

  		var bounds = this._renderer._bounds,
  		    w = this.options.weight,
  		    p = new Point(w, w);

  		// increase clip padding by stroke width to avoid stroke on clip edges
  		bounds = new Bounds(bounds.min.subtract(p), bounds.max.add(p));

  		this._parts = [];
  		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
  			return;
  		}

  		if (this.options.noClip) {
  			this._parts = this._rings;
  			return;
  		}

  		for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
  			clipped = clipPolygon(this._rings[i], bounds, true);
  			if (clipped.length) {
  				this._parts.push(clipped);
  			}
  		}
  	},

  	_updatePath: function () {
  		this._renderer._updatePoly(this, true);
  	},

  	// Needed by the `Canvas` renderer for interactivity
  	_containsPoint: function (p) {
  		var inside = false,
  		    part, p1, p2, i, j, k, len, len2;

  		if (!this._pxBounds || !this._pxBounds.contains(p)) { return false; }

  		// ray casting algorithm for detecting if point is in polygon
  		for (i = 0, len = this._parts.length; i < len; i++) {
  			part = this._parts[i];

  			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
  				p1 = part[j];
  				p2 = part[k];

  				if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
  					inside = !inside;
  				}
  			}
  		}

  		// also check if it's on polygon stroke
  		return inside || Polyline.prototype._containsPoint.call(this, p, true);
  	}

  });


  // @factory L.polygon(latlngs: LatLng[], options?: Polyline options)
  function polygon(latlngs, options) {
  	return new Polygon(latlngs, options);
  }

  /*
   * @class GeoJSON
   * @aka L.GeoJSON
   * @inherits FeatureGroup
   *
   * Represents a GeoJSON object or an array of GeoJSON objects. Allows you to parse
   * GeoJSON data and display it on the map. Extends `FeatureGroup`.
   *
   * @example
   *
   * ```js
   * L.geoJSON(data, {
   * 	style: function (feature) {
   * 		return {color: feature.properties.color};
   * 	}
   * }).bindPopup(function (layer) {
   * 	return layer.feature.properties.description;
   * }).addTo(map);
   * ```
   */

  var GeoJSON = FeatureGroup.extend({

  	/* @section
  	 * @aka GeoJSON options
  	 *
  	 * @option pointToLayer: Function = *
  	 * A `Function` defining how GeoJSON points spawn Leaflet layers. It is internally
  	 * called when data is added, passing the GeoJSON point feature and its `LatLng`.
  	 * The default is to spawn a default `Marker`:
  	 * ```js
  	 * function(geoJsonPoint, latlng) {
  	 * 	return L.marker(latlng);
  	 * }
  	 * ```
  	 *
  	 * @option style: Function = *
  	 * A `Function` defining the `Path options` for styling GeoJSON lines and polygons,
  	 * called internally when data is added.
  	 * The default value is to not override any defaults:
  	 * ```js
  	 * function (geoJsonFeature) {
  	 * 	return {}
  	 * }
  	 * ```
  	 *
  	 * @option onEachFeature: Function = *
  	 * A `Function` that will be called once for each created `Feature`, after it has
  	 * been created and styled. Useful for attaching events and popups to features.
  	 * The default is to do nothing with the newly created layers:
  	 * ```js
  	 * function (feature, layer) {}
  	 * ```
  	 *
  	 * @option filter: Function = *
  	 * A `Function` that will be used to decide whether to include a feature or not.
  	 * The default is to include all features:
  	 * ```js
  	 * function (geoJsonFeature) {
  	 * 	return true;
  	 * }
  	 * ```
  	 * Note: dynamically changing the `filter` option will have effect only on newly
  	 * added data. It will _not_ re-evaluate already included features.
  	 *
  	 * @option coordsToLatLng: Function = *
  	 * A `Function` that will be used for converting GeoJSON coordinates to `LatLng`s.
  	 * The default is the `coordsToLatLng` static method.
  	 *
  	 * @option markersInheritOptions: Boolean = false
  	 * Whether default Markers for "Point" type Features inherit from group options.
  	 */

  	initialize: function (geojson, options) {
  		setOptions(this, options);

  		this._layers = {};

  		if (geojson) {
  			this.addData(geojson);
  		}
  	},

  	// @method addData( <GeoJSON> data ): this
  	// Adds a GeoJSON object to the layer.
  	addData: function (geojson) {
  		var features = isArray(geojson) ? geojson : geojson.features,
  		    i, len, feature;

  		if (features) {
  			for (i = 0, len = features.length; i < len; i++) {
  				// only add this if geometry or geometries are set and not null
  				feature = features[i];
  				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
  					this.addData(feature);
  				}
  			}
  			return this;
  		}

  		var options = this.options;

  		if (options.filter && !options.filter(geojson)) { return this; }

  		var layer = geometryToLayer(geojson, options);
  		if (!layer) {
  			return this;
  		}
  		layer.feature = asFeature(geojson);

  		layer.defaultOptions = layer.options;
  		this.resetStyle(layer);

  		if (options.onEachFeature) {
  			options.onEachFeature(geojson, layer);
  		}

  		return this.addLayer(layer);
  	},

  	// @method resetStyle( <Path> layer? ): this
  	// Resets the given vector layer's style to the original GeoJSON style, useful for resetting style after hover events.
  	// If `layer` is omitted, the style of all features in the current layer is reset.
  	resetStyle: function (layer) {
  		if (layer === undefined) {
  			return this.eachLayer(this.resetStyle, this);
  		}
  		// reset any custom styles
  		layer.options = extend({}, layer.defaultOptions);
  		this._setLayerStyle(layer, this.options.style);
  		return this;
  	},

  	// @method setStyle( <Function> style ): this
  	// Changes styles of GeoJSON vector layers with the given style function.
  	setStyle: function (style) {
  		return this.eachLayer(function (layer) {
  			this._setLayerStyle(layer, style);
  		}, this);
  	},

  	_setLayerStyle: function (layer, style) {
  		if (layer.setStyle) {
  			if (typeof style === 'function') {
  				style = style(layer.feature);
  			}
  			layer.setStyle(style);
  		}
  	}
  });

  // @section
  // There are several static functions which can be called without instantiating L.GeoJSON:

  // @function geometryToLayer(featureData: Object, options?: GeoJSON options): Layer
  // Creates a `Layer` from a given GeoJSON feature. Can use a custom
  // [`pointToLayer`](#geojson-pointtolayer) and/or [`coordsToLatLng`](#geojson-coordstolatlng)
  // functions if provided as options.
  function geometryToLayer(geojson, options) {

  	var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
  	    coords = geometry ? geometry.coordinates : null,
  	    layers = [],
  	    pointToLayer = options && options.pointToLayer,
  	    _coordsToLatLng = options && options.coordsToLatLng || coordsToLatLng,
  	    latlng, latlngs, i, len;

  	if (!coords && !geometry) {
  		return null;
  	}

  	switch (geometry.type) {
  	case 'Point':
  		latlng = _coordsToLatLng(coords);
  		return _pointToLayer(pointToLayer, geojson, latlng, options);

  	case 'MultiPoint':
  		for (i = 0, len = coords.length; i < len; i++) {
  			latlng = _coordsToLatLng(coords[i]);
  			layers.push(_pointToLayer(pointToLayer, geojson, latlng, options));
  		}
  		return new FeatureGroup(layers);

  	case 'LineString':
  	case 'MultiLineString':
  		latlngs = coordsToLatLngs(coords, geometry.type === 'LineString' ? 0 : 1, _coordsToLatLng);
  		return new Polyline(latlngs, options);

  	case 'Polygon':
  	case 'MultiPolygon':
  		latlngs = coordsToLatLngs(coords, geometry.type === 'Polygon' ? 1 : 2, _coordsToLatLng);
  		return new Polygon(latlngs, options);

  	case 'GeometryCollection':
  		for (i = 0, len = geometry.geometries.length; i < len; i++) {
  			var layer = geometryToLayer({
  				geometry: geometry.geometries[i],
  				type: 'Feature',
  				properties: geojson.properties
  			}, options);

  			if (layer) {
  				layers.push(layer);
  			}
  		}
  		return new FeatureGroup(layers);

  	default:
  		throw new Error('Invalid GeoJSON object.');
  	}
  }

  function _pointToLayer(pointToLayerFn, geojson, latlng, options) {
  	return pointToLayerFn ?
  		pointToLayerFn(geojson, latlng) :
  		new Marker(latlng, options && options.markersInheritOptions && options);
  }

  // @function coordsToLatLng(coords: Array): LatLng
  // Creates a `LatLng` object from an array of 2 numbers (longitude, latitude)
  // or 3 numbers (longitude, latitude, altitude) used in GeoJSON for points.
  function coordsToLatLng(coords) {
  	return new LatLng(coords[1], coords[0], coords[2]);
  }

  // @function coordsToLatLngs(coords: Array, levelsDeep?: Number, coordsToLatLng?: Function): Array
  // Creates a multidimensional array of `LatLng`s from a GeoJSON coordinates array.
  // `levelsDeep` specifies the nesting level (0 is for an array of points, 1 for an array of arrays of points, etc., 0 by default).
  // Can use a custom [`coordsToLatLng`](#geojson-coordstolatlng) function.
  function coordsToLatLngs(coords, levelsDeep, _coordsToLatLng) {
  	var latlngs = [];

  	for (var i = 0, len = coords.length, latlng; i < len; i++) {
  		latlng = levelsDeep ?
  			coordsToLatLngs(coords[i], levelsDeep - 1, _coordsToLatLng) :
  			(_coordsToLatLng || coordsToLatLng)(coords[i]);

  		latlngs.push(latlng);
  	}

  	return latlngs;
  }

  // @function latLngToCoords(latlng: LatLng, precision?: Number): Array
  // Reverse of [`coordsToLatLng`](#geojson-coordstolatlng)
  function latLngToCoords(latlng, precision) {
  	precision = typeof precision === 'number' ? precision : 6;
  	return latlng.alt !== undefined ?
  		[formatNum(latlng.lng, precision), formatNum(latlng.lat, precision), formatNum(latlng.alt, precision)] :
  		[formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
  }

  // @function latLngsToCoords(latlngs: Array, levelsDeep?: Number, closed?: Boolean): Array
  // Reverse of [`coordsToLatLngs`](#geojson-coordstolatlngs)
  // `closed` determines whether the first point should be appended to the end of the array to close the feature, only used when `levelsDeep` is 0. False by default.
  function latLngsToCoords(latlngs, levelsDeep, closed, precision) {
  	var coords = [];

  	for (var i = 0, len = latlngs.length; i < len; i++) {
  		coords.push(levelsDeep ?
  			latLngsToCoords(latlngs[i], levelsDeep - 1, closed, precision) :
  			latLngToCoords(latlngs[i], precision));
  	}

  	if (!levelsDeep && closed) {
  		coords.push(coords[0]);
  	}

  	return coords;
  }

  function getFeature(layer, newGeometry) {
  	return layer.feature ?
  		extend({}, layer.feature, {geometry: newGeometry}) :
  		asFeature(newGeometry);
  }

  // @function asFeature(geojson: Object): Object
  // Normalize GeoJSON geometries/features into GeoJSON features.
  function asFeature(geojson) {
  	if (geojson.type === 'Feature' || geojson.type === 'FeatureCollection') {
  		return geojson;
  	}

  	return {
  		type: 'Feature',
  		properties: {},
  		geometry: geojson
  	};
  }

  var PointToGeoJSON = {
  	toGeoJSON: function (precision) {
  		return getFeature(this, {
  			type: 'Point',
  			coordinates: latLngToCoords(this.getLatLng(), precision)
  		});
  	}
  };

  // @namespace Marker
  // @section Other methods
  // @method toGeoJSON(precision?: Number): Object
  // `precision` is the number of decimal places for coordinates.
  // The default value is 6 places.
  // Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the marker (as a GeoJSON `Point` Feature).
  Marker.include(PointToGeoJSON);

  // @namespace CircleMarker
  // @method toGeoJSON(precision?: Number): Object
  // `precision` is the number of decimal places for coordinates.
  // The default value is 6 places.
  // Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the circle marker (as a GeoJSON `Point` Feature).
  Circle.include(PointToGeoJSON);
  CircleMarker.include(PointToGeoJSON);


  // @namespace Polyline
  // @method toGeoJSON(precision?: Number): Object
  // `precision` is the number of decimal places for coordinates.
  // The default value is 6 places.
  // Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the polyline (as a GeoJSON `LineString` or `MultiLineString` Feature).
  Polyline.include({
  	toGeoJSON: function (precision) {
  		var multi = !isFlat(this._latlngs);

  		var coords = latLngsToCoords(this._latlngs, multi ? 1 : 0, false, precision);

  		return getFeature(this, {
  			type: (multi ? 'Multi' : '') + 'LineString',
  			coordinates: coords
  		});
  	}
  });

  // @namespace Polygon
  // @method toGeoJSON(precision?: Number): Object
  // `precision` is the number of decimal places for coordinates.
  // The default value is 6 places.
  // Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the polygon (as a GeoJSON `Polygon` or `MultiPolygon` Feature).
  Polygon.include({
  	toGeoJSON: function (precision) {
  		var holes = !isFlat(this._latlngs),
  		    multi = holes && !isFlat(this._latlngs[0]);

  		var coords = latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true, precision);

  		if (!holes) {
  			coords = [coords];
  		}

  		return getFeature(this, {
  			type: (multi ? 'Multi' : '') + 'Polygon',
  			coordinates: coords
  		});
  	}
  });


  // @namespace LayerGroup
  LayerGroup.include({
  	toMultiPoint: function (precision) {
  		var coords = [];

  		this.eachLayer(function (layer) {
  			coords.push(layer.toGeoJSON(precision).geometry.coordinates);
  		});

  		return getFeature(this, {
  			type: 'MultiPoint',
  			coordinates: coords
  		});
  	},

  	// @method toGeoJSON(precision?: Number): Object
  	// `precision` is the number of decimal places for coordinates.
  	// The default value is 6 places.
  	// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the layer group (as a GeoJSON `FeatureCollection`, `GeometryCollection`, or `MultiPoint`).
  	toGeoJSON: function (precision) {

  		var type = this.feature && this.feature.geometry && this.feature.geometry.type;

  		if (type === 'MultiPoint') {
  			return this.toMultiPoint(precision);
  		}

  		var isGeometryCollection = type === 'GeometryCollection',
  		    jsons = [];

  		this.eachLayer(function (layer) {
  			if (layer.toGeoJSON) {
  				var json = layer.toGeoJSON(precision);
  				if (isGeometryCollection) {
  					jsons.push(json.geometry);
  				} else {
  					var feature = asFeature(json);
  					// Squash nested feature collections
  					if (feature.type === 'FeatureCollection') {
  						jsons.push.apply(jsons, feature.features);
  					} else {
  						jsons.push(feature);
  					}
  				}
  			}
  		});

  		if (isGeometryCollection) {
  			return getFeature(this, {
  				geometries: jsons,
  				type: 'GeometryCollection'
  			});
  		}

  		return {
  			type: 'FeatureCollection',
  			features: jsons
  		};
  	}
  });

  // @namespace GeoJSON
  // @factory L.geoJSON(geojson?: Object, options?: GeoJSON options)
  // Creates a GeoJSON layer. Optionally accepts an object in
  // [GeoJSON format](https://tools.ietf.org/html/rfc7946) to display on the map
  // (you can alternatively add it later with `addData` method) and an `options` object.
  function geoJSON(geojson, options) {
  	return new GeoJSON(geojson, options);
  }

  // Backward compatibility.
  var geoJson = geoJSON;

  /*
   * @class ImageOverlay
   * @aka L.ImageOverlay
   * @inherits Interactive layer
   *
   * Used to load and display a single image over specific bounds of the map. Extends `Layer`.
   *
   * @example
   *
   * ```js
   * var imageUrl = 'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
   * 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
   * L.imageOverlay(imageUrl, imageBounds).addTo(map);
   * ```
   */

  var ImageOverlay = Layer.extend({

  	// @section
  	// @aka ImageOverlay options
  	options: {
  		// @option opacity: Number = 1.0
  		// The opacity of the image overlay.
  		opacity: 1,

  		// @option alt: String = ''
  		// Text for the `alt` attribute of the image (useful for accessibility).
  		alt: '',

  		// @option interactive: Boolean = false
  		// If `true`, the image overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
  		interactive: false,

  		// @option crossOrigin: Boolean|String = false
  		// Whether the crossOrigin attribute will be added to the image.
  		// If a String is provided, the image will have its crossOrigin attribute set to the String provided. This is needed if you want to access image pixel data.
  		// Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
  		crossOrigin: false,

  		// @option errorOverlayUrl: String = ''
  		// URL to the overlay image to show in place of the overlay that failed to load.
  		errorOverlayUrl: '',

  		// @option zIndex: Number = 1
  		// The explicit [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index) of the overlay layer.
  		zIndex: 1,

  		// @option className: String = ''
  		// A custom class name to assign to the image. Empty by default.
  		className: ''
  	},

  	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
  		this._url = url;
  		this._bounds = toLatLngBounds(bounds);

  		setOptions(this, options);
  	},

  	onAdd: function () {
  		if (!this._image) {
  			this._initImage();

  			if (this.options.opacity < 1) {
  				this._updateOpacity();
  			}
  		}

  		if (this.options.interactive) {
  			addClass(this._image, 'leaflet-interactive');
  			this.addInteractiveTarget(this._image);
  		}

  		this.getPane().appendChild(this._image);
  		this._reset();
  	},

  	onRemove: function () {
  		remove(this._image);
  		if (this.options.interactive) {
  			this.removeInteractiveTarget(this._image);
  		}
  	},

  	// @method setOpacity(opacity: Number): this
  	// Sets the opacity of the overlay.
  	setOpacity: function (opacity) {
  		this.options.opacity = opacity;

  		if (this._image) {
  			this._updateOpacity();
  		}
  		return this;
  	},

  	setStyle: function (styleOpts) {
  		if (styleOpts.opacity) {
  			this.setOpacity(styleOpts.opacity);
  		}
  		return this;
  	},

  	// @method bringToFront(): this
  	// Brings the layer to the top of all overlays.
  	bringToFront: function () {
  		if (this._map) {
  			toFront(this._image);
  		}
  		return this;
  	},

  	// @method bringToBack(): this
  	// Brings the layer to the bottom of all overlays.
  	bringToBack: function () {
  		if (this._map) {
  			toBack(this._image);
  		}
  		return this;
  	},

  	// @method setUrl(url: String): this
  	// Changes the URL of the image.
  	setUrl: function (url) {
  		this._url = url;

  		if (this._image) {
  			this._image.src = url;
  		}
  		return this;
  	},

  	// @method setBounds(bounds: LatLngBounds): this
  	// Update the bounds that this ImageOverlay covers
  	setBounds: function (bounds) {
  		this._bounds = toLatLngBounds(bounds);

  		if (this._map) {
  			this._reset();
  		}
  		return this;
  	},

  	getEvents: function () {
  		var events = {
  			zoom: this._reset,
  			viewreset: this._reset
  		};

  		if (this._zoomAnimated) {
  			events.zoomanim = this._animateZoom;
  		}

  		return events;
  	},

  	// @method setZIndex(value: Number): this
  	// Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
  	setZIndex: function (value) {
  		this.options.zIndex = value;
  		this._updateZIndex();
  		return this;
  	},

  	// @method getBounds(): LatLngBounds
  	// Get the bounds that this ImageOverlay covers
  	getBounds: function () {
  		return this._bounds;
  	},

  	// @method getElement(): HTMLElement
  	// Returns the instance of [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
  	// used by this overlay.
  	getElement: function () {
  		return this._image;
  	},

  	_initImage: function () {
  		var wasElementSupplied = this._url.tagName === 'IMG';
  		var img = this._image = wasElementSupplied ? this._url : create$1('img');

  		addClass(img, 'leaflet-image-layer');
  		if (this._zoomAnimated) { addClass(img, 'leaflet-zoom-animated'); }
  		if (this.options.className) { addClass(img, this.options.className); }

  		img.onselectstart = falseFn;
  		img.onmousemove = falseFn;

  		// @event load: Event
  		// Fired when the ImageOverlay layer has loaded its image
  		img.onload = bind(this.fire, this, 'load');
  		img.onerror = bind(this._overlayOnError, this, 'error');

  		if (this.options.crossOrigin || this.options.crossOrigin === '') {
  			img.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
  		}

  		if (this.options.zIndex) {
  			this._updateZIndex();
  		}

  		if (wasElementSupplied) {
  			this._url = img.src;
  			return;
  		}

  		img.src = this._url;
  		img.alt = this.options.alt;
  	},

  	_animateZoom: function (e) {
  		var scale = this._map.getZoomScale(e.zoom),
  		    offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;

  		setTransform(this._image, offset, scale);
  	},

  	_reset: function () {
  		var image = this._image,
  		    bounds = new Bounds(
  		        this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
  		        this._map.latLngToLayerPoint(this._bounds.getSouthEast())),
  		    size = bounds.getSize();

  		setPosition(image, bounds.min);

  		image.style.width  = size.x + 'px';
  		image.style.height = size.y + 'px';
  	},

  	_updateOpacity: function () {
  		setOpacity(this._image, this.options.opacity);
  	},

  	_updateZIndex: function () {
  		if (this._image && this.options.zIndex !== undefined && this.options.zIndex !== null) {
  			this._image.style.zIndex = this.options.zIndex;
  		}
  	},

  	_overlayOnError: function () {
  		// @event error: Event
  		// Fired when the ImageOverlay layer fails to load its image
  		this.fire('error');

  		var errorUrl = this.options.errorOverlayUrl;
  		if (errorUrl && this._url !== errorUrl) {
  			this._url = errorUrl;
  			this._image.src = errorUrl;
  		}
  	}
  });

  // @factory L.imageOverlay(imageUrl: String, bounds: LatLngBounds, options?: ImageOverlay options)
  // Instantiates an image overlay object given the URL of the image and the
  // geographical bounds it is tied to.
  var imageOverlay = function (url, bounds, options) {
  	return new ImageOverlay(url, bounds, options);
  };

  /*
   * @class VideoOverlay
   * @aka L.VideoOverlay
   * @inherits ImageOverlay
   *
   * Used to load and display a video player over specific bounds of the map. Extends `ImageOverlay`.
   *
   * A video overlay uses the [`<video>`](https://developer.mozilla.org/docs/Web/HTML/Element/video)
   * HTML5 element.
   *
   * @example
   *
   * ```js
   * var videoUrl = 'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
   * 	videoBounds = [[ 32, -130], [ 13, -100]];
   * L.videoOverlay(videoUrl, videoBounds ).addTo(map);
   * ```
   */

  var VideoOverlay = ImageOverlay.extend({

  	// @section
  	// @aka VideoOverlay options
  	options: {
  		// @option autoplay: Boolean = true
  		// Whether the video starts playing automatically when loaded.
  		autoplay: true,

  		// @option loop: Boolean = true
  		// Whether the video will loop back to the beginning when played.
  		loop: true,

  		// @option keepAspectRatio: Boolean = true
  		// Whether the video will save aspect ratio after the projection.
  		// Relevant for supported browsers. Browser compatibility- https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
  		keepAspectRatio: true,

  		// @option muted: Boolean = false
  		// Whether the video starts on mute when loaded.
  		muted: false
  	},

  	_initImage: function () {
  		var wasElementSupplied = this._url.tagName === 'VIDEO';
  		var vid = this._image = wasElementSupplied ? this._url : create$1('video');

  		addClass(vid, 'leaflet-image-layer');
  		if (this._zoomAnimated) { addClass(vid, 'leaflet-zoom-animated'); }
  		if (this.options.className) { addClass(vid, this.options.className); }

  		vid.onselectstart = falseFn;
  		vid.onmousemove = falseFn;

  		// @event load: Event
  		// Fired when the video has finished loading the first frame
  		vid.onloadeddata = bind(this.fire, this, 'load');

  		if (wasElementSupplied) {
  			var sourceElements = vid.getElementsByTagName('source');
  			var sources = [];
  			for (var j = 0; j < sourceElements.length; j++) {
  				sources.push(sourceElements[j].src);
  			}

  			this._url = (sourceElements.length > 0) ? sources : [vid.src];
  			return;
  		}

  		if (!isArray(this._url)) { this._url = [this._url]; }

  		if (!this.options.keepAspectRatio && Object.prototype.hasOwnProperty.call(vid.style, 'objectFit')) {
  			vid.style['objectFit'] = 'fill';
  		}
  		vid.autoplay = !!this.options.autoplay;
  		vid.loop = !!this.options.loop;
  		vid.muted = !!this.options.muted;
  		for (var i = 0; i < this._url.length; i++) {
  			var source = create$1('source');
  			source.src = this._url[i];
  			vid.appendChild(source);
  		}
  	}

  	// @method getElement(): HTMLVideoElement
  	// Returns the instance of [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
  	// used by this overlay.
  });


  // @factory L.videoOverlay(video: String|Array|HTMLVideoElement, bounds: LatLngBounds, options?: VideoOverlay options)
  // Instantiates an image overlay object given the URL of the video (or array of URLs, or even a video element) and the
  // geographical bounds it is tied to.

  function videoOverlay(video, bounds, options) {
  	return new VideoOverlay(video, bounds, options);
  }

  /*
   * @class SVGOverlay
   * @aka L.SVGOverlay
   * @inherits ImageOverlay
   *
   * Used to load, display and provide DOM access to an SVG file over specific bounds of the map. Extends `ImageOverlay`.
   *
   * An SVG overlay uses the [`<svg>`](https://developer.mozilla.org/docs/Web/SVG/Element/svg) element.
   *
   * @example
   *
   * ```js
   * var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   * svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
   * svgElement.setAttribute('viewBox', "0 0 200 200");
   * svgElement.innerHTML = '<rect width="200" height="200"/><rect x="75" y="23" width="50" height="50" style="fill:red"/><rect x="75" y="123" width="50" height="50" style="fill:#0013ff"/>';
   * var svgElementBounds = [ [ 32, -130 ], [ 13, -100 ] ];
   * L.svgOverlay(svgElement, svgElementBounds).addTo(map);
   * ```
   */

  var SVGOverlay = ImageOverlay.extend({
  	_initImage: function () {
  		var el = this._image = this._url;

  		addClass(el, 'leaflet-image-layer');
  		if (this._zoomAnimated) { addClass(el, 'leaflet-zoom-animated'); }
  		if (this.options.className) { addClass(el, this.options.className); }

  		el.onselectstart = falseFn;
  		el.onmousemove = falseFn;
  	}

  	// @method getElement(): SVGElement
  	// Returns the instance of [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)
  	// used by this overlay.
  });


  // @factory L.svgOverlay(svg: String|SVGElement, bounds: LatLngBounds, options?: SVGOverlay options)
  // Instantiates an image overlay object given an SVG element and the geographical bounds it is tied to.
  // A viewBox attribute is required on the SVG element to zoom in and out properly.

  function svgOverlay(el, bounds, options) {
  	return new SVGOverlay(el, bounds, options);
  }

  /*
   * @class DivOverlay
   * @inherits Layer
   * @aka L.DivOverlay
   * Base model for L.Popup and L.Tooltip. Inherit from it for custom popup like plugins.
   */

  // @namespace DivOverlay
  var DivOverlay = Layer.extend({

  	// @section
  	// @aka DivOverlay options
  	options: {
  		// @option offset: Point = Point(0, 7)
  		// The offset of the popup position. Useful to control the anchor
  		// of the popup when opening it on some overlays.
  		offset: [0, 7],

  		// @option className: String = ''
  		// A custom CSS class name to assign to the popup.
  		className: '',

  		// @option pane: String = 'popupPane'
  		// `Map pane` where the popup will be added.
  		pane: 'popupPane'
  	},

  	initialize: function (options, source) {
  		setOptions(this, options);

  		this._source = source;
  	},

  	onAdd: function (map) {
  		this._zoomAnimated = map._zoomAnimated;

  		if (!this._container) {
  			this._initLayout();
  		}

  		if (map._fadeAnimated) {
  			setOpacity(this._container, 0);
  		}

  		clearTimeout(this._removeTimeout);
  		this.getPane().appendChild(this._container);
  		this.update();

  		if (map._fadeAnimated) {
  			setOpacity(this._container, 1);
  		}

  		this.bringToFront();
  	},

  	onRemove: function (map) {
  		if (map._fadeAnimated) {
  			setOpacity(this._container, 0);
  			this._removeTimeout = setTimeout(bind(remove, undefined, this._container), 200);
  		} else {
  			remove(this._container);
  		}
  	},

  	// @namespace Popup
  	// @method getLatLng: LatLng
  	// Returns the geographical point of popup.
  	getLatLng: function () {
  		return this._latlng;
  	},

  	// @method setLatLng(latlng: LatLng): this
  	// Sets the geographical point where the popup will open.
  	setLatLng: function (latlng) {
  		this._latlng = toLatLng(latlng);
  		if (this._map) {
  			this._updatePosition();
  			this._adjustPan();
  		}
  		return this;
  	},

  	// @method getContent: String|HTMLElement
  	// Returns the content of the popup.
  	getContent: function () {
  		return this._content;
  	},

  	// @method setContent(htmlContent: String|HTMLElement|Function): this
  	// Sets the HTML content of the popup. If a function is passed the source layer will be passed to the function. The function should return a `String` or `HTMLElement` to be used in the popup.
  	setContent: function (content) {
  		this._content = content;
  		this.update();
  		return this;
  	},

  	// @method getElement: String|HTMLElement
  	// Returns the HTML container of the popup.
  	getElement: function () {
  		return this._container;
  	},

  	// @method update: null
  	// Updates the popup content, layout and position. Useful for updating the popup after something inside changed, e.g. image loaded.
  	update: function () {
  		if (!this._map) { return; }

  		this._container.style.visibility = 'hidden';

  		this._updateContent();
  		this._updateLayout();
  		this._updatePosition();

  		this._container.style.visibility = '';

  		this._adjustPan();
  	},

  	getEvents: function () {
  		var events = {
  			zoom: this._updatePosition,
  			viewreset: this._updatePosition
  		};

  		if (this._zoomAnimated) {
  			events.zoomanim = this._animateZoom;
  		}
  		return events;
  	},

  	// @method isOpen: Boolean
  	// Returns `true` when the popup is visible on the map.
  	isOpen: function () {
  		return !!this._map && this._map.hasLayer(this);
  	},

  	// @method bringToFront: this
  	// Brings this popup in front of other popups (in the same map pane).
  	bringToFront: function () {
  		if (this._map) {
  			toFront(this._container);
  		}
  		return this;
  	},

  	// @method bringToBack: this
  	// Brings this popup to the back of other popups (in the same map pane).
  	bringToBack: function () {
  		if (this._map) {
  			toBack(this._container);
  		}
  		return this;
  	},

  	_prepareOpen: function (parent, layer, latlng) {
  		if (!(layer instanceof Layer)) {
  			latlng = layer;
  			layer = parent;
  		}

  		if (layer instanceof FeatureGroup) {
  			for (var id in parent._layers) {
  				layer = parent._layers[id];
  				break;
  			}
  		}

  		if (!latlng) {
  			if (layer.getCenter) {
  				latlng = layer.getCenter();
  			} else if (layer.getLatLng) {
  				latlng = layer.getLatLng();
  			} else {
  				throw new Error('Unable to get source layer LatLng.');
  			}
  		}

  		// set overlay source to this layer
  		this._source = layer;

  		// update the overlay (content, layout, ect...)
  		this.update();

  		return latlng;
  	},

  	_updateContent: function () {
  		if (!this._content) { return; }

  		var node = this._contentNode;
  		var content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

  		if (typeof content === 'string') {
  			node.innerHTML = content;
  		} else {
  			while (node.hasChildNodes()) {
  				node.removeChild(node.firstChild);
  			}
  			node.appendChild(content);
  		}
  		this.fire('contentupdate');
  	},

  	_updatePosition: function () {
  		if (!this._map) { return; }

  		var pos = this._map.latLngToLayerPoint(this._latlng),
  		    offset = toPoint(this.options.offset),
  		    anchor = this._getAnchor();

  		if (this._zoomAnimated) {
  			setPosition(this._container, pos.add(anchor));
  		} else {
  			offset = offset.add(pos).add(anchor);
  		}

  		var bottom = this._containerBottom = -offset.y,
  		    left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

  		// bottom position the popup in case the height of the popup changes (images loading etc)
  		this._container.style.bottom = bottom + 'px';
  		this._container.style.left = left + 'px';
  	},

  	_getAnchor: function () {
  		return [0, 0];
  	}

  });

  /*
   * @class Popup
   * @inherits DivOverlay
   * @aka L.Popup
   * Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
   * open popups while making sure that only one popup is open at one time
   * (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
   *
   * @example
   *
   * If you want to just bind a popup to marker click and then open it, it's really easy:
   *
   * ```js
   * marker.bindPopup(popupContent).openPopup();
   * ```
   * Path overlays like polylines also have a `bindPopup` method.
   * Here's a more complicated way to open a popup on a map:
   *
   * ```js
   * var popup = L.popup()
   * 	.setLatLng(latlng)
   * 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
   * 	.openOn(map);
   * ```
   */


  // @namespace Popup
  var Popup = DivOverlay.extend({

  	// @section
  	// @aka Popup options
  	options: {
  		// @option maxWidth: Number = 300
  		// Max width of the popup, in pixels.
  		maxWidth: 300,

  		// @option minWidth: Number = 50
  		// Min width of the popup, in pixels.
  		minWidth: 50,

  		// @option maxHeight: Number = null
  		// If set, creates a scrollable container of the given height
  		// inside a popup if its content exceeds it.
  		maxHeight: null,

  		// @option autoPan: Boolean = true
  		// Set it to `false` if you don't want the map to do panning animation
  		// to fit the opened popup.
  		autoPan: true,

  		// @option autoPanPaddingTopLeft: Point = null
  		// The margin between the popup and the top left corner of the map
  		// view after autopanning was performed.
  		autoPanPaddingTopLeft: null,

  		// @option autoPanPaddingBottomRight: Point = null
  		// The margin between the popup and the bottom right corner of the map
  		// view after autopanning was performed.
  		autoPanPaddingBottomRight: null,

  		// @option autoPanPadding: Point = Point(5, 5)
  		// Equivalent of setting both top left and bottom right autopan padding to the same value.
  		autoPanPadding: [5, 5],

  		// @option keepInView: Boolean = false
  		// Set it to `true` if you want to prevent users from panning the popup
  		// off of the screen while it is open.
  		keepInView: false,

  		// @option closeButton: Boolean = true
  		// Controls the presence of a close button in the popup.
  		closeButton: true,

  		// @option autoClose: Boolean = true
  		// Set it to `false` if you want to override the default behavior of
  		// the popup closing when another popup is opened.
  		autoClose: true,

  		// @option closeOnEscapeKey: Boolean = true
  		// Set it to `false` if you want to override the default behavior of
  		// the ESC key for closing of the popup.
  		closeOnEscapeKey: true,

  		// @option closeOnClick: Boolean = *
  		// Set it if you want to override the default behavior of the popup closing when user clicks
  		// on the map. Defaults to the map's [`closePopupOnClick`](#map-closepopuponclick) option.

  		// @option className: String = ''
  		// A custom CSS class name to assign to the popup.
  		className: ''
  	},

  	// @namespace Popup
  	// @method openOn(map: Map): this
  	// Adds the popup to the map and closes the previous one. The same as `map.openPopup(popup)`.
  	openOn: function (map) {
  		map.openPopup(this);
  		return this;
  	},

  	onAdd: function (map) {
  		DivOverlay.prototype.onAdd.call(this, map);

  		// @namespace Map
  		// @section Popup events
  		// @event popupopen: PopupEvent
  		// Fired when a popup is opened in the map
  		map.fire('popupopen', {popup: this});

  		if (this._source) {
  			// @namespace Layer
  			// @section Popup events
  			// @event popupopen: PopupEvent
  			// Fired when a popup bound to this layer is opened
  			this._source.fire('popupopen', {popup: this}, true);
  			// For non-path layers, we toggle the popup when clicking
  			// again the layer, so prevent the map to reopen it.
  			if (!(this._source instanceof Path)) {
  				this._source.on('preclick', stopPropagation);
  			}
  		}
  	},

  	onRemove: function (map) {
  		DivOverlay.prototype.onRemove.call(this, map);

  		// @namespace Map
  		// @section Popup events
  		// @event popupclose: PopupEvent
  		// Fired when a popup in the map is closed
  		map.fire('popupclose', {popup: this});

  		if (this._source) {
  			// @namespace Layer
  			// @section Popup events
  			// @event popupclose: PopupEvent
  			// Fired when a popup bound to this layer is closed
  			this._source.fire('popupclose', {popup: this}, true);
  			if (!(this._source instanceof Path)) {
  				this._source.off('preclick', stopPropagation);
  			}
  		}
  	},

  	getEvents: function () {
  		var events = DivOverlay.prototype.getEvents.call(this);

  		if (this.options.closeOnClick !== undefined ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
  			events.preclick = this._close;
  		}

  		if (this.options.keepInView) {
  			events.moveend = this._adjustPan;
  		}

  		return events;
  	},

  	_close: function () {
  		if (this._map) {
  			this._map.closePopup(this);
  		}
  	},

  	_initLayout: function () {
  		var prefix = 'leaflet-popup',
  		    container = this._container = create$1('div',
  			prefix + ' ' + (this.options.className || '') +
  			' leaflet-zoom-animated');

  		var wrapper = this._wrapper = create$1('div', prefix + '-content-wrapper', container);
  		this._contentNode = create$1('div', prefix + '-content', wrapper);

  		disableClickPropagation(container);
  		disableScrollPropagation(this._contentNode);
  		on(container, 'contextmenu', stopPropagation);

  		this._tipContainer = create$1('div', prefix + '-tip-container', container);
  		this._tip = create$1('div', prefix + '-tip', this._tipContainer);

  		if (this.options.closeButton) {
  			var closeButton = this._closeButton = create$1('a', prefix + '-close-button', container);
  			closeButton.href = '#close';
  			closeButton.innerHTML = '&#215;';

  			on(closeButton, 'click', this._onCloseButtonClick, this);
  		}
  	},

  	_updateLayout: function () {
  		var container = this._contentNode,
  		    style = container.style;

  		style.width = '';
  		style.whiteSpace = 'nowrap';

  		var width = container.offsetWidth;
  		width = Math.min(width, this.options.maxWidth);
  		width = Math.max(width, this.options.minWidth);

  		style.width = (width + 1) + 'px';
  		style.whiteSpace = '';

  		style.height = '';

  		var height = container.offsetHeight,
  		    maxHeight = this.options.maxHeight,
  		    scrolledClass = 'leaflet-popup-scrolled';

  		if (maxHeight && height > maxHeight) {
  			style.height = maxHeight + 'px';
  			addClass(container, scrolledClass);
  		} else {
  			removeClass(container, scrolledClass);
  		}

  		this._containerWidth = this._container.offsetWidth;
  	},

  	_animateZoom: function (e) {
  		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
  		    anchor = this._getAnchor();
  		setPosition(this._container, pos.add(anchor));
  	},

  	_adjustPan: function () {
  		if (!this.options.autoPan) { return; }
  		if (this._map._panAnim) { this._map._panAnim.stop(); }

  		var map = this._map,
  		    marginBottom = parseInt(getStyle(this._container, 'marginBottom'), 10) || 0,
  		    containerHeight = this._container.offsetHeight + marginBottom,
  		    containerWidth = this._containerWidth,
  		    layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);

  		layerPos._add(getPosition(this._container));

  		var containerPos = map.layerPointToContainerPoint(layerPos),
  		    padding = toPoint(this.options.autoPanPadding),
  		    paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding),
  		    paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding),
  		    size = map.getSize(),
  		    dx = 0,
  		    dy = 0;

  		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
  			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
  		}
  		if (containerPos.x - dx - paddingTL.x < 0) { // left
  			dx = containerPos.x - paddingTL.x;
  		}
  		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
  			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
  		}
  		if (containerPos.y - dy - paddingTL.y < 0) { // top
  			dy = containerPos.y - paddingTL.y;
  		}

  		// @namespace Map
  		// @section Popup events
  		// @event autopanstart: Event
  		// Fired when the map starts autopanning when opening a popup.
  		if (dx || dy) {
  			map
  			    .fire('autopanstart')
  			    .panBy([dx, dy]);
  		}
  	},

  	_onCloseButtonClick: function (e) {
  		this._close();
  		stop(e);
  	},

  	_getAnchor: function () {
  		// Where should we anchor the popup on the source layer?
  		return toPoint(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
  	}

  });

  // @namespace Popup
  // @factory L.popup(options?: Popup options, source?: Layer)
  // Instantiates a `Popup` object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the popup with a reference to the Layer to which it refers.
  var popup = function (options, source) {
  	return new Popup(options, source);
  };


  /* @namespace Map
   * @section Interaction Options
   * @option closePopupOnClick: Boolean = true
   * Set it to `false` if you don't want popups to close when user clicks the map.
   */
  Map.mergeOptions({
  	closePopupOnClick: true
  });


  // @namespace Map
  // @section Methods for Layers and Controls
  Map.include({
  	// @method openPopup(popup: Popup): this
  	// Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
  	// @alternative
  	// @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
  	// Creates a popup with the specified content and options and opens it in the given point on a map.
  	openPopup: function (popup, latlng, options) {
  		if (!(popup instanceof Popup)) {
  			popup = new Popup(options).setContent(popup);
  		}

  		if (latlng) {
  			popup.setLatLng(latlng);
  		}

  		if (this.hasLayer(popup)) {
  			return this;
  		}

  		if (this._popup && this._popup.options.autoClose) {
  			this.closePopup();
  		}

  		this._popup = popup;
  		return this.addLayer(popup);
  	},

  	// @method closePopup(popup?: Popup): this
  	// Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
  	closePopup: function (popup) {
  		if (!popup || popup === this._popup) {
  			popup = this._popup;
  			this._popup = null;
  		}
  		if (popup) {
  			this.removeLayer(popup);
  		}
  		return this;
  	}
  });

  /*
   * @namespace Layer
   * @section Popup methods example
   *
   * All layers share a set of methods convenient for binding popups to it.
   *
   * ```js
   * var layer = L.Polygon(latlngs).bindPopup('Hi There!').addTo(map);
   * layer.openPopup();
   * layer.closePopup();
   * ```
   *
   * Popups will also be automatically opened when the layer is clicked on and closed when the layer is removed from the map or another popup is opened.
   */

  // @section Popup methods
  Layer.include({

  	// @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
  	// Binds a popup to the layer with the passed `content` and sets up the
  	// necessary event listeners. If a `Function` is passed it will receive
  	// the layer as the first argument and should return a `String` or `HTMLElement`.
  	bindPopup: function (content, options) {

  		if (content instanceof Popup) {
  			setOptions(content, options);
  			this._popup = content;
  			content._source = this;
  		} else {
  			if (!this._popup || options) {
  				this._popup = new Popup(options, this);
  			}
  			this._popup.setContent(content);
  		}

  		if (!this._popupHandlersAdded) {
  			this.on({
  				click: this._openPopup,
  				keypress: this._onKeyPress,
  				remove: this.closePopup,
  				move: this._movePopup
  			});
  			this._popupHandlersAdded = true;
  		}

  		return this;
  	},

  	// @method unbindPopup(): this
  	// Removes the popup previously bound with `bindPopup`.
  	unbindPopup: function () {
  		if (this._popup) {
  			this.off({
  				click: this._openPopup,
  				keypress: this._onKeyPress,
  				remove: this.closePopup,
  				move: this._movePopup
  			});
  			this._popupHandlersAdded = false;
  			this._popup = null;
  		}
  		return this;
  	},

  	// @method openPopup(latlng?: LatLng): this
  	// Opens the bound popup at the specified `latlng` or at the default popup anchor if no `latlng` is passed.
  	openPopup: function (layer, latlng) {
  		if (this._popup && this._map) {
  			latlng = this._popup._prepareOpen(this, layer, latlng);

  			// open the popup on the map
  			this._map.openPopup(this._popup, latlng);
  		}

  		return this;
  	},

  	// @method closePopup(): this
  	// Closes the popup bound to this layer if it is open.
  	closePopup: function () {
  		if (this._popup) {
  			this._popup._close();
  		}
  		return this;
  	},

  	// @method togglePopup(): this
  	// Opens or closes the popup bound to this layer depending on its current state.
  	togglePopup: function (target) {
  		if (this._popup) {
  			if (this._popup._map) {
  				this.closePopup();
  			} else {
  				this.openPopup(target);
  			}
  		}
  		return this;
  	},

  	// @method isPopupOpen(): boolean
  	// Returns `true` if the popup bound to this layer is currently open.
  	isPopupOpen: function () {
  		return (this._popup ? this._popup.isOpen() : false);
  	},

  	// @method setPopupContent(content: String|HTMLElement|Popup): this
  	// Sets the content of the popup bound to this layer.
  	setPopupContent: function (content) {
  		if (this._popup) {
  			this._popup.setContent(content);
  		}
  		return this;
  	},

  	// @method getPopup(): Popup
  	// Returns the popup bound to this layer.
  	getPopup: function () {
  		return this._popup;
  	},

  	_openPopup: function (e) {
  		var layer = e.layer || e.target;

  		if (!this._popup) {
  			return;
  		}

  		if (!this._map) {
  			return;
  		}

  		// prevent map click
  		stop(e);

  		// if this inherits from Path its a vector and we can just
  		// open the popup at the new location
  		if (layer instanceof Path) {
  			this.openPopup(e.layer || e.target, e.latlng);
  			return;
  		}

  		// otherwise treat it like a marker and figure out
  		// if we should toggle it open/closed
  		if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
  			this.closePopup();
  		} else {
  			this.openPopup(layer, e.latlng);
  		}
  	},

  	_movePopup: function (e) {
  		this._popup.setLatLng(e.latlng);
  	},

  	_onKeyPress: function (e) {
  		if (e.originalEvent.keyCode === 13) {
  			this._openPopup(e);
  		}
  	}
  });

  /*
   * @class Tooltip
   * @inherits DivOverlay
   * @aka L.Tooltip
   * Used to display small texts on top of map layers.
   *
   * @example
   *
   * ```js
   * marker.bindTooltip("my tooltip text").openTooltip();
   * ```
   * Note about tooltip offset. Leaflet takes two options in consideration
   * for computing tooltip offsetting:
   * - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
   *   Add a positive x offset to move the tooltip to the right, and a positive y offset to
   *   move it to the bottom. Negatives will move to the left and top.
   * - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
   *   should adapt this value if you use a custom icon.
   */


  // @namespace Tooltip
  var Tooltip = DivOverlay.extend({

  	// @section
  	// @aka Tooltip options
  	options: {
  		// @option pane: String = 'tooltipPane'
  		// `Map pane` where the tooltip will be added.
  		pane: 'tooltipPane',

  		// @option offset: Point = Point(0, 0)
  		// Optional offset of the tooltip position.
  		offset: [0, 0],

  		// @option direction: String = 'auto'
  		// Direction where to open the tooltip. Possible values are: `right`, `left`,
  		// `top`, `bottom`, `center`, `auto`.
  		// `auto` will dynamically switch between `right` and `left` according to the tooltip
  		// position on the map.
  		direction: 'auto',

  		// @option permanent: Boolean = false
  		// Whether to open the tooltip permanently or only on mouseover.
  		permanent: false,

  		// @option sticky: Boolean = false
  		// If true, the tooltip will follow the mouse instead of being fixed at the feature center.
  		sticky: false,

  		// @option interactive: Boolean = false
  		// If true, the tooltip will listen to the feature events.
  		interactive: false,

  		// @option opacity: Number = 0.9
  		// Tooltip container opacity.
  		opacity: 0.9
  	},

  	onAdd: function (map) {
  		DivOverlay.prototype.onAdd.call(this, map);
  		this.setOpacity(this.options.opacity);

  		// @namespace Map
  		// @section Tooltip events
  		// @event tooltipopen: TooltipEvent
  		// Fired when a tooltip is opened in the map.
  		map.fire('tooltipopen', {tooltip: this});

  		if (this._source) {
  			// @namespace Layer
  			// @section Tooltip events
  			// @event tooltipopen: TooltipEvent
  			// Fired when a tooltip bound to this layer is opened.
  			this._source.fire('tooltipopen', {tooltip: this}, true);
  		}
  	},

  	onRemove: function (map) {
  		DivOverlay.prototype.onRemove.call(this, map);

  		// @namespace Map
  		// @section Tooltip events
  		// @event tooltipclose: TooltipEvent
  		// Fired when a tooltip in the map is closed.
  		map.fire('tooltipclose', {tooltip: this});

  		if (this._source) {
  			// @namespace Layer
  			// @section Tooltip events
  			// @event tooltipclose: TooltipEvent
  			// Fired when a tooltip bound to this layer is closed.
  			this._source.fire('tooltipclose', {tooltip: this}, true);
  		}
  	},

  	getEvents: function () {
  		var events = DivOverlay.prototype.getEvents.call(this);

  		if (touch && !this.options.permanent) {
  			events.preclick = this._close;
  		}

  		return events;
  	},

  	_close: function () {
  		if (this._map) {
  			this._map.closeTooltip(this);
  		}
  	},

  	_initLayout: function () {
  		var prefix = 'leaflet-tooltip',
  		    className = prefix + ' ' + (this.options.className || '') + ' leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

  		this._contentNode = this._container = create$1('div', className);
  	},

  	_updateLayout: function () {},

  	_adjustPan: function () {},

  	_setPosition: function (pos) {
  		var subX, subY,
  		    map = this._map,
  		    container = this._container,
  		    centerPoint = map.latLngToContainerPoint(map.getCenter()),
  		    tooltipPoint = map.layerPointToContainerPoint(pos),
  		    direction = this.options.direction,
  		    tooltipWidth = container.offsetWidth,
  		    tooltipHeight = container.offsetHeight,
  		    offset = toPoint(this.options.offset),
  		    anchor = this._getAnchor();

  		if (direction === 'top') {
  			subX = tooltipWidth / 2;
  			subY = tooltipHeight;
  		} else if (direction === 'bottom') {
  			subX = tooltipWidth / 2;
  			subY = 0;
  		} else if (direction === 'center') {
  			subX = tooltipWidth / 2;
  			subY = tooltipHeight / 2;
  		} else if (direction === 'right') {
  			subX = 0;
  			subY = tooltipHeight / 2;
  		} else if (direction === 'left') {
  			subX = tooltipWidth;
  			subY = tooltipHeight / 2;
  		} else if (tooltipPoint.x < centerPoint.x) {
  			direction = 'right';
  			subX = 0;
  			subY = tooltipHeight / 2;
  		} else {
  			direction = 'left';
  			subX = tooltipWidth + (offset.x + anchor.x) * 2;
  			subY = tooltipHeight / 2;
  		}

  		pos = pos.subtract(toPoint(subX, subY, true)).add(offset).add(anchor);

  		removeClass(container, 'leaflet-tooltip-right');
  		removeClass(container, 'leaflet-tooltip-left');
  		removeClass(container, 'leaflet-tooltip-top');
  		removeClass(container, 'leaflet-tooltip-bottom');
  		addClass(container, 'leaflet-tooltip-' + direction);
  		setPosition(container, pos);
  	},

  	_updatePosition: function () {
  		var pos = this._map.latLngToLayerPoint(this._latlng);
  		this._setPosition(pos);
  	},

  	setOpacity: function (opacity) {
  		this.options.opacity = opacity;

  		if (this._container) {
  			setOpacity(this._container, opacity);
  		}
  	},

  	_animateZoom: function (e) {
  		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
  		this._setPosition(pos);
  	},

  	_getAnchor: function () {
  		// Where should we anchor the tooltip on the source layer?
  		return toPoint(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
  	}

  });

  // @namespace Tooltip
  // @factory L.tooltip(options?: Tooltip options, source?: Layer)
  // Instantiates a Tooltip object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the tooltip with a reference to the Layer to which it refers.
  var tooltip = function (options, source) {
  	return new Tooltip(options, source);
  };

  // @namespace Map
  // @section Methods for Layers and Controls
  Map.include({

  	// @method openTooltip(tooltip: Tooltip): this
  	// Opens the specified tooltip.
  	// @alternative
  	// @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
  	// Creates a tooltip with the specified content and options and open it.
  	openTooltip: function (tooltip, latlng, options) {
  		if (!(tooltip instanceof Tooltip)) {
  			tooltip = new Tooltip(options).setContent(tooltip);
  		}

  		if (latlng) {
  			tooltip.setLatLng(latlng);
  		}

  		if (this.hasLayer(tooltip)) {
  			return this;
  		}

  		return this.addLayer(tooltip);
  	},

  	// @method closeTooltip(tooltip?: Tooltip): this
  	// Closes the tooltip given as parameter.
  	closeTooltip: function (tooltip) {
  		if (tooltip) {
  			this.removeLayer(tooltip);
  		}
  		return this;
  	}

  });

  /*
   * @namespace Layer
   * @section Tooltip methods example
   *
   * All layers share a set of methods convenient for binding tooltips to it.
   *
   * ```js
   * var layer = L.Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
   * layer.openTooltip();
   * layer.closeTooltip();
   * ```
   */

  // @section Tooltip methods
  Layer.include({

  	// @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
  	// Binds a tooltip to the layer with the passed `content` and sets up the
  	// necessary event listeners. If a `Function` is passed it will receive
  	// the layer as the first argument and should return a `String` or `HTMLElement`.
  	bindTooltip: function (content, options) {

  		if (content instanceof Tooltip) {
  			setOptions(content, options);
  			this._tooltip = content;
  			content._source = this;
  		} else {
  			if (!this._tooltip || options) {
  				this._tooltip = new Tooltip(options, this);
  			}
  			this._tooltip.setContent(content);

  		}

  		this._initTooltipInteractions();

  		if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
  			this.openTooltip();
  		}

  		return this;
  	},

  	// @method unbindTooltip(): this
  	// Removes the tooltip previously bound with `bindTooltip`.
  	unbindTooltip: function () {
  		if (this._tooltip) {
  			this._initTooltipInteractions(true);
  			this.closeTooltip();
  			this._tooltip = null;
  		}
  		return this;
  	},

  	_initTooltipInteractions: function (remove$$1) {
  		if (!remove$$1 && this._tooltipHandlersAdded) { return; }
  		var onOff = remove$$1 ? 'off' : 'on',
  		    events = {
  			remove: this.closeTooltip,
  			move: this._moveTooltip
  		    };
  		if (!this._tooltip.options.permanent) {
  			events.mouseover = this._openTooltip;
  			events.mouseout = this.closeTooltip;
  			if (this._tooltip.options.sticky) {
  				events.mousemove = this._moveTooltip;
  			}
  			if (touch) {
  				events.click = this._openTooltip;
  			}
  		} else {
  			events.add = this._openTooltip;
  		}
  		this[onOff](events);
  		this._tooltipHandlersAdded = !remove$$1;
  	},

  	// @method openTooltip(latlng?: LatLng): this
  	// Opens the bound tooltip at the specified `latlng` or at the default tooltip anchor if no `latlng` is passed.
  	openTooltip: function (layer, latlng) {
  		if (this._tooltip && this._map) {
  			latlng = this._tooltip._prepareOpen(this, layer, latlng);

  			// open the tooltip on the map
  			this._map.openTooltip(this._tooltip, latlng);

  			// Tooltip container may not be defined if not permanent and never
  			// opened.
  			if (this._tooltip.options.interactive && this._tooltip._container) {
  				addClass(this._tooltip._container, 'leaflet-clickable');
  				this.addInteractiveTarget(this._tooltip._container);
  			}
  		}

  		return this;
  	},

  	// @method closeTooltip(): this
  	// Closes the tooltip bound to this layer if it is open.
  	closeTooltip: function () {
  		if (this._tooltip) {
  			this._tooltip._close();
  			if (this._tooltip.options.interactive && this._tooltip._container) {
  				removeClass(this._tooltip._container, 'leaflet-clickable');
  				this.removeInteractiveTarget(this._tooltip._container);
  			}
  		}
  		return this;
  	},

  	// @method toggleTooltip(): this
  	// Opens or closes the tooltip bound to this layer depending on its current state.
  	toggleTooltip: function (target) {
  		if (this._tooltip) {
  			if (this._tooltip._map) {
  				this.closeTooltip();
  			} else {
  				this.openTooltip(target);
  			}
  		}
  		return this;
  	},

  	// @method isTooltipOpen(): boolean
  	// Returns `true` if the tooltip bound to this layer is currently open.
  	isTooltipOpen: function () {
  		return this._tooltip.isOpen();
  	},

  	// @method setTooltipContent(content: String|HTMLElement|Tooltip): this
  	// Sets the content of the tooltip bound to this layer.
  	setTooltipContent: function (content) {
  		if (this._tooltip) {
  			this._tooltip.setContent(content);
  		}
  		return this;
  	},

  	// @method getTooltip(): Tooltip
  	// Returns the tooltip bound to this layer.
  	getTooltip: function () {
  		return this._tooltip;
  	},

  	_openTooltip: function (e) {
  		var layer = e.layer || e.target;

  		if (!this._tooltip || !this._map) {
  			return;
  		}
  		this.openTooltip(layer, this._tooltip.options.sticky ? e.latlng : undefined);
  	},

  	_moveTooltip: function (e) {
  		var latlng = e.latlng, containerPoint, layerPoint;
  		if (this._tooltip.options.sticky && e.originalEvent) {
  			containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
  			layerPoint = this._map.containerPointToLayerPoint(containerPoint);
  			latlng = this._map.layerPointToLatLng(layerPoint);
  		}
  		this._tooltip.setLatLng(latlng);
  	}
  });

  /*
   * @class DivIcon
   * @aka L.DivIcon
   * @inherits Icon
   *
   * Represents a lightweight icon for markers that uses a simple `<div>`
   * element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and shadow options.
   *
   * @example
   * ```js
   * var myIcon = L.divIcon({className: 'my-div-icon'});
   * // you can set .my-div-icon styles in CSS
   *
   * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
   * ```
   *
   * By default, it has a 'leaflet-div-icon' CSS class and is styled as a little white square with a shadow.
   */

  var DivIcon = Icon.extend({
  	options: {
  		// @section
  		// @aka DivIcon options
  		iconSize: [12, 12], // also can be set through CSS

  		// iconAnchor: (Point),
  		// popupAnchor: (Point),

  		// @option html: String|HTMLElement = ''
  		// Custom HTML code to put inside the div element, empty by default. Alternatively,
  		// an instance of `HTMLElement`.
  		html: false,

  		// @option bgPos: Point = [0, 0]
  		// Optional relative position of the background, in pixels
  		bgPos: null,

  		className: 'leaflet-div-icon'
  	},

  	createIcon: function (oldIcon) {
  		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
  		    options = this.options;

  		if (options.html instanceof Element) {
  			empty(div);
  			div.appendChild(options.html);
  		} else {
  			div.innerHTML = options.html !== false ? options.html : '';
  		}

  		if (options.bgPos) {
  			var bgPos = toPoint(options.bgPos);
  			div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
  		}
  		this._setIconStyles(div, 'icon');

  		return div;
  	},

  	createShadow: function () {
  		return null;
  	}
  });

  // @factory L.divIcon(options: DivIcon options)
  // Creates a `DivIcon` instance with the given options.
  function divIcon(options) {
  	return new DivIcon(options);
  }

  Icon.Default = IconDefault;

  /*
   * @class GridLayer
   * @inherits Layer
   * @aka L.GridLayer
   *
   * Generic class for handling a tiled grid of HTML elements. This is the base class for all tile layers and replaces `TileLayer.Canvas`.
   * GridLayer can be extended to create a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will handle creating and animating these DOM elements for you.
   *
   *
   * @section Synchronous usage
   * @example
   *
   * To create a custom layer, extend GridLayer and implement the `createTile()` method, which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level) coordinates to draw your tile.
   *
   * ```js
   * var CanvasLayer = L.GridLayer.extend({
   *     createTile: function(coords){
   *         // create a <canvas> element for drawing
   *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
   *
   *         // setup tile width and height according to the options
   *         var size = this.getTileSize();
   *         tile.width = size.x;
   *         tile.height = size.y;
   *
   *         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
   *         var ctx = tile.getContext('2d');
   *
   *         // return the tile so it can be rendered on screen
   *         return tile;
   *     }
   * });
   * ```
   *
   * @section Asynchronous usage
   * @example
   *
   * Tile creation can also be asynchronous, this is useful when using a third-party drawing library. Once the tile is finished drawing it can be passed to the `done()` callback.
   *
   * ```js
   * var CanvasLayer = L.GridLayer.extend({
   *     createTile: function(coords, done){
   *         var error;
   *
   *         // create a <canvas> element for drawing
   *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
   *
   *         // setup tile width and height according to the options
   *         var size = this.getTileSize();
   *         tile.width = size.x;
   *         tile.height = size.y;
   *
   *         // draw something asynchronously and pass the tile to the done() callback
   *         setTimeout(function() {
   *             done(error, tile);
   *         }, 1000);
   *
   *         return tile;
   *     }
   * });
   * ```
   *
   * @section
   */


  var GridLayer = Layer.extend({

  	// @section
  	// @aka GridLayer options
  	options: {
  		// @option tileSize: Number|Point = 256
  		// Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
  		tileSize: 256,

  		// @option opacity: Number = 1.0
  		// Opacity of the tiles. Can be used in the `createTile()` function.
  		opacity: 1,

  		// @option updateWhenIdle: Boolean = (depends)
  		// Load new tiles only when panning ends.
  		// `true` by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
  		// `false` otherwise in order to display new tiles _during_ panning, since it is easy to pan outside the
  		// [`keepBuffer`](#gridlayer-keepbuffer) option in desktop browsers.
  		updateWhenIdle: mobile,

  		// @option updateWhenZooming: Boolean = true
  		// By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
  		updateWhenZooming: true,

  		// @option updateInterval: Number = 200
  		// Tiles will not update more than once every `updateInterval` milliseconds when panning.
  		updateInterval: 200,

  		// @option zIndex: Number = 1
  		// The explicit zIndex of the tile layer.
  		zIndex: 1,

  		// @option bounds: LatLngBounds = undefined
  		// If set, tiles will only be loaded inside the set `LatLngBounds`.
  		bounds: null,

  		// @option minZoom: Number = 0
  		// The minimum zoom level down to which this layer will be displayed (inclusive).
  		minZoom: 0,

  		// @option maxZoom: Number = undefined
  		// The maximum zoom level up to which this layer will be displayed (inclusive).
  		maxZoom: undefined,

  		// @option maxNativeZoom: Number = undefined
  		// Maximum zoom number the tile source has available. If it is specified,
  		// the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
  		// from `maxNativeZoom` level and auto-scaled.
  		maxNativeZoom: undefined,

  		// @option minNativeZoom: Number = undefined
  		// Minimum zoom number the tile source has available. If it is specified,
  		// the tiles on all zoom levels lower than `minNativeZoom` will be loaded
  		// from `minNativeZoom` level and auto-scaled.
  		minNativeZoom: undefined,

  		// @option noWrap: Boolean = false
  		// Whether the layer is wrapped around the antimeridian. If `true`, the
  		// GridLayer will only be displayed once at low zoom levels. Has no
  		// effect when the [map CRS](#map-crs) doesn't wrap around. Can be used
  		// in combination with [`bounds`](#gridlayer-bounds) to prevent requesting
  		// tiles outside the CRS limits.
  		noWrap: false,

  		// @option pane: String = 'tilePane'
  		// `Map pane` where the grid layer will be added.
  		pane: 'tilePane',

  		// @option className: String = ''
  		// A custom class name to assign to the tile layer. Empty by default.
  		className: '',

  		// @option keepBuffer: Number = 2
  		// When panning the map, keep this many rows and columns of tiles before unloading them.
  		keepBuffer: 2
  	},

  	initialize: function (options) {
  		setOptions(this, options);
  	},

  	onAdd: function () {
  		this._initContainer();

  		this._levels = {};
  		this._tiles = {};

  		this._resetView();
  		this._update();
  	},

  	beforeAdd: function (map) {
  		map._addZoomLimit(this);
  	},

  	onRemove: function (map) {
  		this._removeAllTiles();
  		remove(this._container);
  		map._removeZoomLimit(this);
  		this._container = null;
  		this._tileZoom = undefined;
  	},

  	// @method bringToFront: this
  	// Brings the tile layer to the top of all tile layers.
  	bringToFront: function () {
  		if (this._map) {
  			toFront(this._container);
  			this._setAutoZIndex(Math.max);
  		}
  		return this;
  	},

  	// @method bringToBack: this
  	// Brings the tile layer to the bottom of all tile layers.
  	bringToBack: function () {
  		if (this._map) {
  			toBack(this._container);
  			this._setAutoZIndex(Math.min);
  		}
  		return this;
  	},

  	// @method getContainer: HTMLElement
  	// Returns the HTML element that contains the tiles for this layer.
  	getContainer: function () {
  		return this._container;
  	},

  	// @method setOpacity(opacity: Number): this
  	// Changes the [opacity](#gridlayer-opacity) of the grid layer.
  	setOpacity: function (opacity) {
  		this.options.opacity = opacity;
  		this._updateOpacity();
  		return this;
  	},

  	// @method setZIndex(zIndex: Number): this
  	// Changes the [zIndex](#gridlayer-zindex) of the grid layer.
  	setZIndex: function (zIndex) {
  		this.options.zIndex = zIndex;
  		this._updateZIndex();

  		return this;
  	},

  	// @method isLoading: Boolean
  	// Returns `true` if any tile in the grid layer has not finished loading.
  	isLoading: function () {
  		return this._loading;
  	},

  	// @method redraw: this
  	// Causes the layer to clear all the tiles and request them again.
  	redraw: function () {
  		if (this._map) {
  			this._removeAllTiles();
  			this._update();
  		}
  		return this;
  	},

  	getEvents: function () {
  		var events = {
  			viewprereset: this._invalidateAll,
  			viewreset: this._resetView,
  			zoom: this._resetView,
  			moveend: this._onMoveEnd
  		};

  		if (!this.options.updateWhenIdle) {
  			// update tiles on move, but not more often than once per given interval
  			if (!this._onMove) {
  				this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
  			}

  			events.move = this._onMove;
  		}

  		if (this._zoomAnimated) {
  			events.zoomanim = this._animateZoom;
  		}

  		return events;
  	},

  	// @section Extension methods
  	// Layers extending `GridLayer` shall reimplement the following method.
  	// @method createTile(coords: Object, done?: Function): HTMLElement
  	// Called only internally, must be overridden by classes extending `GridLayer`.
  	// Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
  	// is specified, it must be called when the tile has finished loading and drawing.
  	createTile: function () {
  		return document.createElement('div');
  	},

  	// @section
  	// @method getTileSize: Point
  	// Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
  	getTileSize: function () {
  		var s = this.options.tileSize;
  		return s instanceof Point ? s : new Point(s, s);
  	},

  	_updateZIndex: function () {
  		if (this._container && this.options.zIndex !== undefined && this.options.zIndex !== null) {
  			this._container.style.zIndex = this.options.zIndex;
  		}
  	},

  	_setAutoZIndex: function (compare) {
  		// go through all other layers of the same pane, set zIndex to max + 1 (front) or min - 1 (back)

  		var layers = this.getPane().children,
  		    edgeZIndex = -compare(-Infinity, Infinity); // -Infinity for max, Infinity for min

  		for (var i = 0, len = layers.length, zIndex; i < len; i++) {

  			zIndex = layers[i].style.zIndex;

  			if (layers[i] !== this._container && zIndex) {
  				edgeZIndex = compare(edgeZIndex, +zIndex);
  			}
  		}

  		if (isFinite(edgeZIndex)) {
  			this.options.zIndex = edgeZIndex + compare(-1, 1);
  			this._updateZIndex();
  		}
  	},

  	_updateOpacity: function () {
  		if (!this._map) { return; }

  		// IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
  		if (ielt9) { return; }

  		setOpacity(this._container, this.options.opacity);

  		var now = +new Date(),
  		    nextFrame = false,
  		    willPrune = false;

  		for (var key in this._tiles) {
  			var tile = this._tiles[key];
  			if (!tile.current || !tile.loaded) { continue; }

  			var fade = Math.min(1, (now - tile.loaded) / 200);

  			setOpacity(tile.el, fade);
  			if (fade < 1) {
  				nextFrame = true;
  			} else {
  				if (tile.active) {
  					willPrune = true;
  				} else {
  					this._onOpaqueTile(tile);
  				}
  				tile.active = true;
  			}
  		}

  		if (willPrune && !this._noPrune) { this._pruneTiles(); }

  		if (nextFrame) {
  			cancelAnimFrame(this._fadeFrame);
  			this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
  		}
  	},

  	_onOpaqueTile: falseFn,

  	_initContainer: function () {
  		if (this._container) { return; }

  		this._container = create$1('div', 'leaflet-layer ' + (this.options.className || ''));
  		this._updateZIndex();

  		if (this.options.opacity < 1) {
  			this._updateOpacity();
  		}

  		this.getPane().appendChild(this._container);
  	},

  	_updateLevels: function () {

  		var zoom = this._tileZoom,
  		    maxZoom = this.options.maxZoom;

  		if (zoom === undefined) { return undefined; }

  		for (var z in this._levels) {
  			z = Number(z);
  			if (this._levels[z].el.children.length || z === zoom) {
  				this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
  				this._onUpdateLevel(z);
  			} else {
  				remove(this._levels[z].el);
  				this._removeTilesAtZoom(z);
  				this._onRemoveLevel(z);
  				delete this._levels[z];
  			}
  		}

  		var level = this._levels[zoom],
  		    map = this._map;

  		if (!level) {
  			level = this._levels[zoom] = {};

  			level.el = create$1('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
  			level.el.style.zIndex = maxZoom;

  			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
  			level.zoom = zoom;

  			this._setZoomTransform(level, map.getCenter(), map.getZoom());

  			// force the browser to consider the newly added element for transition
  			falseFn(level.el.offsetWidth);

  			this._onCreateLevel(level);
  		}

  		this._level = level;

  		return level;
  	},

  	_onUpdateLevel: falseFn,

  	_onRemoveLevel: falseFn,

  	_onCreateLevel: falseFn,

  	_pruneTiles: function () {
  		if (!this._map) {
  			return;
  		}

  		var key, tile;

  		var zoom = this._map.getZoom();
  		if (zoom > this.options.maxZoom ||
  			zoom < this.options.minZoom) {
  			this._removeAllTiles();
  			return;
  		}

  		for (key in this._tiles) {
  			tile = this._tiles[key];
  			tile.retain = tile.current;
  		}

  		for (key in this._tiles) {
  			tile = this._tiles[key];
  			if (tile.current && !tile.active) {
  				var coords = tile.coords;
  				if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
  					this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
  				}
  			}
  		}

  		for (key in this._tiles) {
  			if (!this._tiles[key].retain) {
  				this._removeTile(key);
  			}
  		}
  	},

  	_removeTilesAtZoom: function (zoom) {
  		for (var key in this._tiles) {
  			if (this._tiles[key].coords.z !== zoom) {
  				continue;
  			}
  			this._removeTile(key);
  		}
  	},

  	_removeAllTiles: function () {
  		for (var key in this._tiles) {
  			this._removeTile(key);
  		}
  	},

  	_invalidateAll: function () {
  		for (var z in this._levels) {
  			remove(this._levels[z].el);
  			this._onRemoveLevel(Number(z));
  			delete this._levels[z];
  		}
  		this._removeAllTiles();

  		this._tileZoom = undefined;
  	},

  	_retainParent: function (x, y, z, minZoom) {
  		var x2 = Math.floor(x / 2),
  		    y2 = Math.floor(y / 2),
  		    z2 = z - 1,
  		    coords2 = new Point(+x2, +y2);
  		coords2.z = +z2;

  		var key = this._tileCoordsToKey(coords2),
  		    tile = this._tiles[key];

  		if (tile && tile.active) {
  			tile.retain = true;
  			return true;

  		} else if (tile && tile.loaded) {
  			tile.retain = true;
  		}

  		if (z2 > minZoom) {
  			return this._retainParent(x2, y2, z2, minZoom);
  		}

  		return false;
  	},

  	_retainChildren: function (x, y, z, maxZoom) {

  		for (var i = 2 * x; i < 2 * x + 2; i++) {
  			for (var j = 2 * y; j < 2 * y + 2; j++) {

  				var coords = new Point(i, j);
  				coords.z = z + 1;

  				var key = this._tileCoordsToKey(coords),
  				    tile = this._tiles[key];

  				if (tile && tile.active) {
  					tile.retain = true;
  					continue;

  				} else if (tile && tile.loaded) {
  					tile.retain = true;
  				}

  				if (z + 1 < maxZoom) {
  					this._retainChildren(i, j, z + 1, maxZoom);
  				}
  			}
  		}
  	},

  	_resetView: function (e) {
  		var animating = e && (e.pinch || e.flyTo);
  		this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
  	},

  	_animateZoom: function (e) {
  		this._setView(e.center, e.zoom, true, e.noUpdate);
  	},

  	_clampZoom: function (zoom) {
  		var options = this.options;

  		if (undefined !== options.minNativeZoom && zoom < options.minNativeZoom) {
  			return options.minNativeZoom;
  		}

  		if (undefined !== options.maxNativeZoom && options.maxNativeZoom < zoom) {
  			return options.maxNativeZoom;
  		}

  		return zoom;
  	},

  	_setView: function (center, zoom, noPrune, noUpdate) {
  		var tileZoom = Math.round(zoom);
  		if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
  		    (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
  			tileZoom = undefined;
  		} else {
  			tileZoom = this._clampZoom(tileZoom);
  		}

  		var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);

  		if (!noUpdate || tileZoomChanged) {

  			this._tileZoom = tileZoom;

  			if (this._abortLoading) {
  				this._abortLoading();
  			}

  			this._updateLevels();
  			this._resetGrid();

  			if (tileZoom !== undefined) {
  				this._update(center);
  			}

  			if (!noPrune) {
  				this._pruneTiles();
  			}

  			// Flag to prevent _updateOpacity from pruning tiles during
  			// a zoom anim or a pinch gesture
  			this._noPrune = !!noPrune;
  		}

  		this._setZoomTransforms(center, zoom);
  	},

  	_setZoomTransforms: function (center, zoom) {
  		for (var i in this._levels) {
  			this._setZoomTransform(this._levels[i], center, zoom);
  		}
  	},

  	_setZoomTransform: function (level, center, zoom) {
  		var scale = this._map.getZoomScale(zoom, level.zoom),
  		    translate = level.origin.multiplyBy(scale)
  		        .subtract(this._map._getNewPixelOrigin(center, zoom)).round();

  		if (any3d) {
  			setTransform(level.el, translate, scale);
  		} else {
  			setPosition(level.el, translate);
  		}
  	},

  	_resetGrid: function () {
  		var map = this._map,
  		    crs = map.options.crs,
  		    tileSize = this._tileSize = this.getTileSize(),
  		    tileZoom = this._tileZoom;

  		var bounds = this._map.getPixelWorldBounds(this._tileZoom);
  		if (bounds) {
  			this._globalTileRange = this._pxBoundsToTileRange(bounds);
  		}

  		this._wrapX = crs.wrapLng && !this.options.noWrap && [
  			Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
  			Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
  		];
  		this._wrapY = crs.wrapLat && !this.options.noWrap && [
  			Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
  			Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
  		];
  	},

  	_onMoveEnd: function () {
  		if (!this._map || this._map._animatingZoom) { return; }

  		this._update();
  	},

  	_getTiledPixelBounds: function (center) {
  		var map = this._map,
  		    mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
  		    scale = map.getZoomScale(mapZoom, this._tileZoom),
  		    pixelCenter = map.project(center, this._tileZoom).floor(),
  		    halfSize = map.getSize().divideBy(scale * 2);

  		return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
  	},

  	// Private method to load tiles in the grid's active zoom level according to map bounds
  	_update: function (center) {
  		var map = this._map;
  		if (!map) { return; }
  		var zoom = this._clampZoom(map.getZoom());

  		if (center === undefined) { center = map.getCenter(); }
  		if (this._tileZoom === undefined) { return; }	// if out of minzoom/maxzoom

  		var pixelBounds = this._getTiledPixelBounds(center),
  		    tileRange = this._pxBoundsToTileRange(pixelBounds),
  		    tileCenter = tileRange.getCenter(),
  		    queue = [],
  		    margin = this.options.keepBuffer,
  		    noPruneRange = new Bounds(tileRange.getBottomLeft().subtract([margin, -margin]),
  		                              tileRange.getTopRight().add([margin, -margin]));

  		// Sanity check: panic if the tile range contains Infinity somewhere.
  		if (!(isFinite(tileRange.min.x) &&
  		      isFinite(tileRange.min.y) &&
  		      isFinite(tileRange.max.x) &&
  		      isFinite(tileRange.max.y))) { throw new Error('Attempted to load an infinite number of tiles'); }

  		for (var key in this._tiles) {
  			var c = this._tiles[key].coords;
  			if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) {
  				this._tiles[key].current = false;
  			}
  		}

  		// _update just loads more tiles. If the tile zoom level differs too much
  		// from the map's, let _setView reset levels and prune old tiles.
  		if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

  		// create a queue of coordinates to load tiles from
  		for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
  			for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
  				var coords = new Point(i, j);
  				coords.z = this._tileZoom;

  				if (!this._isValidTile(coords)) { continue; }

  				var tile = this._tiles[this._tileCoordsToKey(coords)];
  				if (tile) {
  					tile.current = true;
  				} else {
  					queue.push(coords);
  				}
  			}
  		}

  		// sort tile queue to load tiles in order of their distance to center
  		queue.sort(function (a, b) {
  			return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
  		});

  		if (queue.length !== 0) {
  			// if it's the first batch of tiles to load
  			if (!this._loading) {
  				this._loading = true;
  				// @event loading: Event
  				// Fired when the grid layer starts loading tiles.
  				this.fire('loading');
  			}

  			// create DOM fragment to append tiles in one batch
  			var fragment = document.createDocumentFragment();

  			for (i = 0; i < queue.length; i++) {
  				this._addTile(queue[i], fragment);
  			}

  			this._level.el.appendChild(fragment);
  		}
  	},

  	_isValidTile: function (coords) {
  		var crs = this._map.options.crs;

  		if (!crs.infinite) {
  			// don't load tile if it's out of bounds and not wrapped
  			var bounds = this._globalTileRange;
  			if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
  			    (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) { return false; }
  		}

  		if (!this.options.bounds) { return true; }

  		// don't load tile if it doesn't intersect the bounds in options
  		var tileBounds = this._tileCoordsToBounds(coords);
  		return toLatLngBounds(this.options.bounds).overlaps(tileBounds);
  	},

  	_keyToBounds: function (key) {
  		return this._tileCoordsToBounds(this._keyToTileCoords(key));
  	},

  	_tileCoordsToNwSe: function (coords) {
  		var map = this._map,
  		    tileSize = this.getTileSize(),
  		    nwPoint = coords.scaleBy(tileSize),
  		    sePoint = nwPoint.add(tileSize),
  		    nw = map.unproject(nwPoint, coords.z),
  		    se = map.unproject(sePoint, coords.z);
  		return [nw, se];
  	},

  	// converts tile coordinates to its geographical bounds
  	_tileCoordsToBounds: function (coords) {
  		var bp = this._tileCoordsToNwSe(coords),
  		    bounds = new LatLngBounds(bp[0], bp[1]);

  		if (!this.options.noWrap) {
  			bounds = this._map.wrapLatLngBounds(bounds);
  		}
  		return bounds;
  	},
  	// converts tile coordinates to key for the tile cache
  	_tileCoordsToKey: function (coords) {
  		return coords.x + ':' + coords.y + ':' + coords.z;
  	},

  	// converts tile cache key to coordinates
  	_keyToTileCoords: function (key) {
  		var k = key.split(':'),
  		    coords = new Point(+k[0], +k[1]);
  		coords.z = +k[2];
  		return coords;
  	},

  	_removeTile: function (key) {
  		var tile = this._tiles[key];
  		if (!tile) { return; }

  		remove(tile.el);

  		delete this._tiles[key];

  		// @event tileunload: TileEvent
  		// Fired when a tile is removed (e.g. when a tile goes off the screen).
  		this.fire('tileunload', {
  			tile: tile.el,
  			coords: this._keyToTileCoords(key)
  		});
  	},

  	_initTile: function (tile) {
  		addClass(tile, 'leaflet-tile');

  		var tileSize = this.getTileSize();
  		tile.style.width = tileSize.x + 'px';
  		tile.style.height = tileSize.y + 'px';

  		tile.onselectstart = falseFn;
  		tile.onmousemove = falseFn;

  		// update opacity on tiles in IE7-8 because of filter inheritance problems
  		if (ielt9 && this.options.opacity < 1) {
  			setOpacity(tile, this.options.opacity);
  		}

  		// without this hack, tiles disappear after zoom on Chrome for Android
  		// https://github.com/Leaflet/Leaflet/issues/2078
  		if (android && !android23) {
  			tile.style.WebkitBackfaceVisibility = 'hidden';
  		}
  	},

  	_addTile: function (coords, container) {
  		var tilePos = this._getTilePos(coords),
  		    key = this._tileCoordsToKey(coords);

  		var tile = this.createTile(this._wrapCoords(coords), bind(this._tileReady, this, coords));

  		this._initTile(tile);

  		// if createTile is defined with a second argument ("done" callback),
  		// we know that tile is async and will be ready later; otherwise
  		if (this.createTile.length < 2) {
  			// mark tile as ready, but delay one frame for opacity animation to happen
  			requestAnimFrame(bind(this._tileReady, this, coords, null, tile));
  		}

  		setPosition(tile, tilePos);

  		// save tile in cache
  		this._tiles[key] = {
  			el: tile,
  			coords: coords,
  			current: true
  		};

  		container.appendChild(tile);
  		// @event tileloadstart: TileEvent
  		// Fired when a tile is requested and starts loading.
  		this.fire('tileloadstart', {
  			tile: tile,
  			coords: coords
  		});
  	},

  	_tileReady: function (coords, err, tile) {
  		if (err) {
  			// @event tileerror: TileErrorEvent
  			// Fired when there is an error loading a tile.
  			this.fire('tileerror', {
  				error: err,
  				tile: tile,
  				coords: coords
  			});
  		}

  		var key = this._tileCoordsToKey(coords);

  		tile = this._tiles[key];
  		if (!tile) { return; }

  		tile.loaded = +new Date();
  		if (this._map._fadeAnimated) {
  			setOpacity(tile.el, 0);
  			cancelAnimFrame(this._fadeFrame);
  			this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
  		} else {
  			tile.active = true;
  			this._pruneTiles();
  		}

  		if (!err) {
  			addClass(tile.el, 'leaflet-tile-loaded');

  			// @event tileload: TileEvent
  			// Fired when a tile loads.
  			this.fire('tileload', {
  				tile: tile.el,
  				coords: coords
  			});
  		}

  		if (this._noTilesToLoad()) {
  			this._loading = false;
  			// @event load: Event
  			// Fired when the grid layer loaded all visible tiles.
  			this.fire('load');

  			if (ielt9 || !this._map._fadeAnimated) {
  				requestAnimFrame(this._pruneTiles, this);
  			} else {
  				// Wait a bit more than 0.2 secs (the duration of the tile fade-in)
  				// to trigger a pruning.
  				setTimeout(bind(this._pruneTiles, this), 250);
  			}
  		}
  	},

  	_getTilePos: function (coords) {
  		return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
  	},

  	_wrapCoords: function (coords) {
  		var newCoords = new Point(
  			this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x,
  			this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y);
  		newCoords.z = coords.z;
  		return newCoords;
  	},

  	_pxBoundsToTileRange: function (bounds) {
  		var tileSize = this.getTileSize();
  		return new Bounds(
  			bounds.min.unscaleBy(tileSize).floor(),
  			bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
  	},

  	_noTilesToLoad: function () {
  		for (var key in this._tiles) {
  			if (!this._tiles[key].loaded) { return false; }
  		}
  		return true;
  	}
  });

  // @factory L.gridLayer(options?: GridLayer options)
  // Creates a new instance of GridLayer with the supplied options.
  function gridLayer(options) {
  	return new GridLayer(options);
  }

  /*
   * @class TileLayer
   * @inherits GridLayer
   * @aka L.TileLayer
   * Used to load and display tile layers on the map. Note that most tile servers require attribution, which you can set under `Layer`. Extends `GridLayer`.
   *
   * @example
   *
   * ```js
   * L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'}).addTo(map);
   * ```
   *
   * @section URL template
   * @example
   *
   * A string of the following form:
   *
   * ```
   * 'http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
   * ```
   *
   * `{s}` means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` — tile coordinates. `{r}` can be used to add "&commat;2x" to the URL to load retina tiles.
   *
   * You can use custom keys in the template, which will be [evaluated](#util-template) from TileLayer options, like this:
   *
   * ```
   * L.tileLayer('http://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
   * ```
   */


  var TileLayer = GridLayer.extend({

  	// @section
  	// @aka TileLayer options
  	options: {
  		// @option minZoom: Number = 0
  		// The minimum zoom level down to which this layer will be displayed (inclusive).
  		minZoom: 0,

  		// @option maxZoom: Number = 18
  		// The maximum zoom level up to which this layer will be displayed (inclusive).
  		maxZoom: 18,

  		// @option subdomains: String|String[] = 'abc'
  		// Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
  		subdomains: 'abc',

  		// @option errorTileUrl: String = ''
  		// URL to the tile image to show in place of the tile that failed to load.
  		errorTileUrl: '',

  		// @option zoomOffset: Number = 0
  		// The zoom number used in tile URLs will be offset with this value.
  		zoomOffset: 0,

  		// @option tms: Boolean = false
  		// If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
  		tms: false,

  		// @option zoomReverse: Boolean = false
  		// If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
  		zoomReverse: false,

  		// @option detectRetina: Boolean = false
  		// If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
  		detectRetina: false,

  		// @option crossOrigin: Boolean|String = false
  		// Whether the crossOrigin attribute will be added to the tiles.
  		// If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
  		// Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
  		crossOrigin: false
  	},

  	initialize: function (url, options) {

  		this._url = url;

  		options = setOptions(this, options);

  		// detecting retina displays, adjusting tileSize and zoom levels
  		if (options.detectRetina && retina && options.maxZoom > 0) {

  			options.tileSize = Math.floor(options.tileSize / 2);

  			if (!options.zoomReverse) {
  				options.zoomOffset++;
  				options.maxZoom--;
  			} else {
  				options.zoomOffset--;
  				options.minZoom++;
  			}

  			options.minZoom = Math.max(0, options.minZoom);
  		}

  		if (typeof options.subdomains === 'string') {
  			options.subdomains = options.subdomains.split('');
  		}

  		// for https://github.com/Leaflet/Leaflet/issues/137
  		if (!android) {
  			this.on('tileunload', this._onTileRemove);
  		}
  	},

  	// @method setUrl(url: String, noRedraw?: Boolean): this
  	// Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
  	// If the URL does not change, the layer will not be redrawn unless
  	// the noRedraw parameter is set to false.
  	setUrl: function (url, noRedraw) {
  		if (this._url === url && noRedraw === undefined) {
  			noRedraw = true;
  		}

  		this._url = url;

  		if (!noRedraw) {
  			this.redraw();
  		}
  		return this;
  	},

  	// @method createTile(coords: Object, done?: Function): HTMLElement
  	// Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
  	// to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
  	// callback is called when the tile has been loaded.
  	createTile: function (coords, done) {
  		var tile = document.createElement('img');

  		on(tile, 'load', bind(this._tileOnLoad, this, done, tile));
  		on(tile, 'error', bind(this._tileOnError, this, done, tile));

  		if (this.options.crossOrigin || this.options.crossOrigin === '') {
  			tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
  		}

  		/*
  		 Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
  		 http://www.w3.org/TR/WCAG20-TECHS/H67
  		*/
  		tile.alt = '';

  		/*
  		 Set role="presentation" to force screen readers to ignore this
  		 https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
  		*/
  		tile.setAttribute('role', 'presentation');

  		tile.src = this.getTileUrl(coords);

  		return tile;
  	},

  	// @section Extension methods
  	// @uninheritable
  	// Layers extending `TileLayer` might reimplement the following method.
  	// @method getTileUrl(coords: Object): String
  	// Called only internally, returns the URL for a tile given its coordinates.
  	// Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
  	getTileUrl: function (coords) {
  		var data = {
  			r: retina ? '@2x' : '',
  			s: this._getSubdomain(coords),
  			x: coords.x,
  			y: coords.y,
  			z: this._getZoomForUrl()
  		};
  		if (this._map && !this._map.options.crs.infinite) {
  			var invertedY = this._globalTileRange.max.y - coords.y;
  			if (this.options.tms) {
  				data['y'] = invertedY;
  			}
  			data['-y'] = invertedY;
  		}

  		return template(this._url, extend(data, this.options));
  	},

  	_tileOnLoad: function (done, tile) {
  		// For https://github.com/Leaflet/Leaflet/issues/3332
  		if (ielt9) {
  			setTimeout(bind(done, this, null, tile), 0);
  		} else {
  			done(null, tile);
  		}
  	},

  	_tileOnError: function (done, tile, e) {
  		var errorUrl = this.options.errorTileUrl;
  		if (errorUrl && tile.getAttribute('src') !== errorUrl) {
  			tile.src = errorUrl;
  		}
  		done(e, tile);
  	},

  	_onTileRemove: function (e) {
  		e.tile.onload = null;
  	},

  	_getZoomForUrl: function () {
  		var zoom = this._tileZoom,
  		maxZoom = this.options.maxZoom,
  		zoomReverse = this.options.zoomReverse,
  		zoomOffset = this.options.zoomOffset;

  		if (zoomReverse) {
  			zoom = maxZoom - zoom;
  		}

  		return zoom + zoomOffset;
  	},

  	_getSubdomain: function (tilePoint) {
  		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
  		return this.options.subdomains[index];
  	},

  	// stops loading all tiles in the background layer
  	_abortLoading: function () {
  		var i, tile;
  		for (i in this._tiles) {
  			if (this._tiles[i].coords.z !== this._tileZoom) {
  				tile = this._tiles[i].el;

  				tile.onload = falseFn;
  				tile.onerror = falseFn;

  				if (!tile.complete) {
  					tile.src = emptyImageUrl;
  					remove(tile);
  					delete this._tiles[i];
  				}
  			}
  		}
  	},

  	_removeTile: function (key) {
  		var tile = this._tiles[key];
  		if (!tile) { return; }

  		// Cancels any pending http requests associated with the tile
  		// unless we're on Android's stock browser,
  		// see https://github.com/Leaflet/Leaflet/issues/137
  		if (!androidStock) {
  			tile.el.setAttribute('src', emptyImageUrl);
  		}

  		return GridLayer.prototype._removeTile.call(this, key);
  	},

  	_tileReady: function (coords, err, tile) {
  		if (!this._map || (tile && tile.getAttribute('src') === emptyImageUrl)) {
  			return;
  		}

  		return GridLayer.prototype._tileReady.call(this, coords, err, tile);
  	}
  });


  // @factory L.tilelayer(urlTemplate: String, options?: TileLayer options)
  // Instantiates a tile layer object given a `URL template` and optionally an options object.

  function tileLayer(url, options) {
  	return new TileLayer(url, options);
  }

  /*
   * @class TileLayer.WMS
   * @inherits TileLayer
   * @aka L.TileLayer.WMS
   * Used to display [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services as tile layers on the map. Extends `TileLayer`.
   *
   * @example
   *
   * ```js
   * var nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
   * 	layers: 'nexrad-n0r-900913',
   * 	format: 'image/png',
   * 	transparent: true,
   * 	attribution: "Weather data © 2012 IEM Nexrad"
   * });
   * ```
   */

  var TileLayerWMS = TileLayer.extend({

  	// @section
  	// @aka TileLayer.WMS options
  	// If any custom options not documented here are used, they will be sent to the
  	// WMS server as extra parameters in each request URL. This can be useful for
  	// [non-standard vendor WMS parameters](http://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
  	defaultWmsParams: {
  		service: 'WMS',
  		request: 'GetMap',

  		// @option layers: String = ''
  		// **(required)** Comma-separated list of WMS layers to show.
  		layers: '',

  		// @option styles: String = ''
  		// Comma-separated list of WMS styles.
  		styles: '',

  		// @option format: String = 'image/jpeg'
  		// WMS image format (use `'image/png'` for layers with transparency).
  		format: 'image/jpeg',

  		// @option transparent: Boolean = false
  		// If `true`, the WMS service will return images with transparency.
  		transparent: false,

  		// @option version: String = '1.1.1'
  		// Version of the WMS service to use
  		version: '1.1.1'
  	},

  	options: {
  		// @option crs: CRS = null
  		// Coordinate Reference System to use for the WMS requests, defaults to
  		// map CRS. Don't change this if you're not sure what it means.
  		crs: null,

  		// @option uppercase: Boolean = false
  		// If `true`, WMS request parameter keys will be uppercase.
  		uppercase: false
  	},

  	initialize: function (url, options) {

  		this._url = url;

  		var wmsParams = extend({}, this.defaultWmsParams);

  		// all keys that are not TileLayer options go to WMS params
  		for (var i in options) {
  			if (!(i in this.options)) {
  				wmsParams[i] = options[i];
  			}
  		}

  		options = setOptions(this, options);

  		var realRetina = options.detectRetina && retina ? 2 : 1;
  		var tileSize = this.getTileSize();
  		wmsParams.width = tileSize.x * realRetina;
  		wmsParams.height = tileSize.y * realRetina;

  		this.wmsParams = wmsParams;
  	},

  	onAdd: function (map) {

  		this._crs = this.options.crs || map.options.crs;
  		this._wmsVersion = parseFloat(this.wmsParams.version);

  		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
  		this.wmsParams[projectionKey] = this._crs.code;

  		TileLayer.prototype.onAdd.call(this, map);
  	},

  	getTileUrl: function (coords) {

  		var tileBounds = this._tileCoordsToNwSe(coords),
  		    crs = this._crs,
  		    bounds = toBounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])),
  		    min = bounds.min,
  		    max = bounds.max,
  		    bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ?
  		    [min.y, min.x, max.y, max.x] :
  		    [min.x, min.y, max.x, max.y]).join(','),
  		    url = TileLayer.prototype.getTileUrl.call(this, coords);
  		return url +
  			getParamString(this.wmsParams, url, this.options.uppercase) +
  			(this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
  	},

  	// @method setParams(params: Object, noRedraw?: Boolean): this
  	// Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
  	setParams: function (params, noRedraw) {

  		extend(this.wmsParams, params);

  		if (!noRedraw) {
  			this.redraw();
  		}

  		return this;
  	}
  });


  // @factory L.tileLayer.wms(baseUrl: String, options: TileLayer.WMS options)
  // Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS parameters/options object.
  function tileLayerWMS(url, options) {
  	return new TileLayerWMS(url, options);
  }

  TileLayer.WMS = TileLayerWMS;
  tileLayer.wms = tileLayerWMS;

  /*
   * @class Renderer
   * @inherits Layer
   * @aka L.Renderer
   *
   * Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
   * DOM container of the renderer, its bounds, and its zoom animation.
   *
   * A `Renderer` works as an implicit layer group for all `Path`s - the renderer
   * itself can be added or removed to the map. All paths use a renderer, which can
   * be implicit (the map will decide the type of renderer and use it automatically)
   * or explicit (using the [`renderer`](#path-renderer) option of the path).
   *
   * Do not use this class directly, use `SVG` and `Canvas` instead.
   *
   * @event update: Event
   * Fired when the renderer updates its bounds, center and zoom, for example when
   * its map has moved
   */

  var Renderer = Layer.extend({

  	// @section
  	// @aka Renderer options
  	options: {
  		// @option padding: Number = 0.1
  		// How much to extend the clip area around the map view (relative to its size)
  		// e.g. 0.1 would be 10% of map view in each direction
  		padding: 0.1,

  		// @option tolerance: Number = 0
  		// How much to extend click tolerance round a path/object on the map
  		tolerance : 0
  	},

  	initialize: function (options) {
  		setOptions(this, options);
  		stamp(this);
  		this._layers = this._layers || {};
  	},

  	onAdd: function () {
  		if (!this._container) {
  			this._initContainer(); // defined by renderer implementations

  			if (this._zoomAnimated) {
  				addClass(this._container, 'leaflet-zoom-animated');
  			}
  		}

  		this.getPane().appendChild(this._container);
  		this._update();
  		this.on('update', this._updatePaths, this);
  	},

  	onRemove: function () {
  		this.off('update', this._updatePaths, this);
  		this._destroyContainer();
  	},

  	getEvents: function () {
  		var events = {
  			viewreset: this._reset,
  			zoom: this._onZoom,
  			moveend: this._update,
  			zoomend: this._onZoomEnd
  		};
  		if (this._zoomAnimated) {
  			events.zoomanim = this._onAnimZoom;
  		}
  		return events;
  	},

  	_onAnimZoom: function (ev) {
  		this._updateTransform(ev.center, ev.zoom);
  	},

  	_onZoom: function () {
  		this._updateTransform(this._map.getCenter(), this._map.getZoom());
  	},

  	_updateTransform: function (center, zoom) {
  		var scale = this._map.getZoomScale(zoom, this._zoom),
  		    position = getPosition(this._container),
  		    viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
  		    currentCenterPoint = this._map.project(this._center, zoom),
  		    destCenterPoint = this._map.project(center, zoom),
  		    centerOffset = destCenterPoint.subtract(currentCenterPoint),

  		    topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

  		if (any3d) {
  			setTransform(this._container, topLeftOffset, scale);
  		} else {
  			setPosition(this._container, topLeftOffset);
  		}
  	},

  	_reset: function () {
  		this._update();
  		this._updateTransform(this._center, this._zoom);

  		for (var id in this._layers) {
  			this._layers[id]._reset();
  		}
  	},

  	_onZoomEnd: function () {
  		for (var id in this._layers) {
  			this._layers[id]._project();
  		}
  	},

  	_updatePaths: function () {
  		for (var id in this._layers) {
  			this._layers[id]._update();
  		}
  	},

  	_update: function () {
  		// Update pixel bounds of renderer container (for positioning/sizing/clipping later)
  		// Subclasses are responsible of firing the 'update' event.
  		var p = this.options.padding,
  		    size = this._map.getSize(),
  		    min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

  		this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

  		this._center = this._map.getCenter();
  		this._zoom = this._map.getZoom();
  	}
  });

  /*
   * @class Canvas
   * @inherits Renderer
   * @aka L.Canvas
   *
   * Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
   * Inherits `Renderer`.
   *
   * Due to [technical limitations](http://caniuse.com/#search=canvas), Canvas is not
   * available in all web browsers, notably IE8, and overlapping geometries might
   * not display properly in some edge cases.
   *
   * @example
   *
   * Use Canvas by default for all paths in the map:
   *
   * ```js
   * var map = L.map('map', {
   * 	renderer: L.canvas()
   * });
   * ```
   *
   * Use a Canvas renderer with extra padding for specific vector geometries:
   *
   * ```js
   * var map = L.map('map');
   * var myRenderer = L.canvas({ padding: 0.5 });
   * var line = L.polyline( coordinates, { renderer: myRenderer } );
   * var circle = L.circle( center, { renderer: myRenderer } );
   * ```
   */

  var Canvas = Renderer.extend({
  	getEvents: function () {
  		var events = Renderer.prototype.getEvents.call(this);
  		events.viewprereset = this._onViewPreReset;
  		return events;
  	},

  	_onViewPreReset: function () {
  		// Set a flag so that a viewprereset+moveend+viewreset only updates&redraws once
  		this._postponeUpdatePaths = true;
  	},

  	onAdd: function () {
  		Renderer.prototype.onAdd.call(this);

  		// Redraw vectors since canvas is cleared upon removal,
  		// in case of removing the renderer itself from the map.
  		this._draw();
  	},

  	_initContainer: function () {
  		var container = this._container = document.createElement('canvas');

  		on(container, 'mousemove', this._onMouseMove, this);
  		on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this);
  		on(container, 'mouseout', this._handleMouseOut, this);

  		this._ctx = container.getContext('2d');
  	},

  	_destroyContainer: function () {
  		cancelAnimFrame(this._redrawRequest);
  		delete this._ctx;
  		remove(this._container);
  		off(this._container);
  		delete this._container;
  	},

  	_updatePaths: function () {
  		if (this._postponeUpdatePaths) { return; }

  		var layer;
  		this._redrawBounds = null;
  		for (var id in this._layers) {
  			layer = this._layers[id];
  			layer._update();
  		}
  		this._redraw();
  	},

  	_update: function () {
  		if (this._map._animatingZoom && this._bounds) { return; }

  		Renderer.prototype._update.call(this);

  		var b = this._bounds,
  		    container = this._container,
  		    size = b.getSize(),
  		    m = retina ? 2 : 1;

  		setPosition(container, b.min);

  		// set canvas size (also clearing it); use double size on retina
  		container.width = m * size.x;
  		container.height = m * size.y;
  		container.style.width = size.x + 'px';
  		container.style.height = size.y + 'px';

  		if (retina) {
  			this._ctx.scale(2, 2);
  		}

  		// translate so we use the same path coordinates after canvas element moves
  		this._ctx.translate(-b.min.x, -b.min.y);

  		// Tell paths to redraw themselves
  		this.fire('update');
  	},

  	_reset: function () {
  		Renderer.prototype._reset.call(this);

  		if (this._postponeUpdatePaths) {
  			this._postponeUpdatePaths = false;
  			this._updatePaths();
  		}
  	},

  	_initPath: function (layer) {
  		this._updateDashArray(layer);
  		this._layers[stamp(layer)] = layer;

  		var order = layer._order = {
  			layer: layer,
  			prev: this._drawLast,
  			next: null
  		};
  		if (this._drawLast) { this._drawLast.next = order; }
  		this._drawLast = order;
  		this._drawFirst = this._drawFirst || this._drawLast;
  	},

  	_addPath: function (layer) {
  		this._requestRedraw(layer);
  	},

  	_removePath: function (layer) {
  		var order = layer._order;
  		var next = order.next;
  		var prev = order.prev;

  		if (next) {
  			next.prev = prev;
  		} else {
  			this._drawLast = prev;
  		}
  		if (prev) {
  			prev.next = next;
  		} else {
  			this._drawFirst = next;
  		}

  		delete layer._order;

  		delete this._layers[stamp(layer)];

  		this._requestRedraw(layer);
  	},

  	_updatePath: function (layer) {
  		// Redraw the union of the layer's old pixel
  		// bounds and the new pixel bounds.
  		this._extendRedrawBounds(layer);
  		layer._project();
  		layer._update();
  		// The redraw will extend the redraw bounds
  		// with the new pixel bounds.
  		this._requestRedraw(layer);
  	},

  	_updateStyle: function (layer) {
  		this._updateDashArray(layer);
  		this._requestRedraw(layer);
  	},

  	_updateDashArray: function (layer) {
  		if (typeof layer.options.dashArray === 'string') {
  			var parts = layer.options.dashArray.split(/[, ]+/),
  			    dashArray = [],
  			    dashValue,
  			    i;
  			for (i = 0; i < parts.length; i++) {
  				dashValue = Number(parts[i]);
  				// Ignore dash array containing invalid lengths
  				if (isNaN(dashValue)) { return; }
  				dashArray.push(dashValue);
  			}
  			layer.options._dashArray = dashArray;
  		} else {
  			layer.options._dashArray = layer.options.dashArray;
  		}
  	},

  	_requestRedraw: function (layer) {
  		if (!this._map) { return; }

  		this._extendRedrawBounds(layer);
  		this._redrawRequest = this._redrawRequest || requestAnimFrame(this._redraw, this);
  	},

  	_extendRedrawBounds: function (layer) {
  		if (layer._pxBounds) {
  			var padding = (layer.options.weight || 0) + 1;
  			this._redrawBounds = this._redrawBounds || new Bounds();
  			this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
  			this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
  		}
  	},

  	_redraw: function () {
  		this._redrawRequest = null;

  		if (this._redrawBounds) {
  			this._redrawBounds.min._floor();
  			this._redrawBounds.max._ceil();
  		}

  		this._clear(); // clear layers in redraw bounds
  		this._draw(); // draw layers

  		this._redrawBounds = null;
  	},

  	_clear: function () {
  		var bounds = this._redrawBounds;
  		if (bounds) {
  			var size = bounds.getSize();
  			this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
  		} else {
  			this._ctx.save();
  			this._ctx.setTransform(1, 0, 0, 1, 0, 0);
  			this._ctx.clearRect(0, 0, this._container.width, this._container.height);
  			this._ctx.restore();
  		}
  	},

  	_draw: function () {
  		var layer, bounds = this._redrawBounds;
  		this._ctx.save();
  		if (bounds) {
  			var size = bounds.getSize();
  			this._ctx.beginPath();
  			this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
  			this._ctx.clip();
  		}

  		this._drawing = true;

  		for (var order = this._drawFirst; order; order = order.next) {
  			layer = order.layer;
  			if (!bounds || (layer._pxBounds && layer._pxBounds.intersects(bounds))) {
  				layer._updatePath();
  			}
  		}

  		this._drawing = false;

  		this._ctx.restore();  // Restore state before clipping.
  	},

  	_updatePoly: function (layer, closed) {
  		if (!this._drawing) { return; }

  		var i, j, len2, p,
  		    parts = layer._parts,
  		    len = parts.length,
  		    ctx = this._ctx;

  		if (!len) { return; }

  		ctx.beginPath();

  		for (i = 0; i < len; i++) {
  			for (j = 0, len2 = parts[i].length; j < len2; j++) {
  				p = parts[i][j];
  				ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
  			}
  			if (closed) {
  				ctx.closePath();
  			}
  		}

  		this._fillStroke(ctx, layer);

  		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
  	},

  	_updateCircle: function (layer) {

  		if (!this._drawing || layer._empty()) { return; }

  		var p = layer._point,
  		    ctx = this._ctx,
  		    r = Math.max(Math.round(layer._radius), 1),
  		    s = (Math.max(Math.round(layer._radiusY), 1) || r) / r;

  		if (s !== 1) {
  			ctx.save();
  			ctx.scale(1, s);
  		}

  		ctx.beginPath();
  		ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

  		if (s !== 1) {
  			ctx.restore();
  		}

  		this._fillStroke(ctx, layer);
  	},

  	_fillStroke: function (ctx, layer) {
  		var options = layer.options;

  		if (options.fill) {
  			ctx.globalAlpha = options.fillOpacity;
  			ctx.fillStyle = options.fillColor || options.color;
  			ctx.fill(options.fillRule || 'evenodd');
  		}

  		if (options.stroke && options.weight !== 0) {
  			if (ctx.setLineDash) {
  				ctx.setLineDash(layer.options && layer.options._dashArray || []);
  			}
  			ctx.globalAlpha = options.opacity;
  			ctx.lineWidth = options.weight;
  			ctx.strokeStyle = options.color;
  			ctx.lineCap = options.lineCap;
  			ctx.lineJoin = options.lineJoin;
  			ctx.stroke();
  		}
  	},

  	// Canvas obviously doesn't have mouse events for individual drawn objects,
  	// so we emulate that by calculating what's under the mouse on mousemove/click manually

  	_onClick: function (e) {
  		var point = this._map.mouseEventToLayerPoint(e), layer, clickedLayer;

  		for (var order = this._drawFirst; order; order = order.next) {
  			layer = order.layer;
  			if (layer.options.interactive && layer._containsPoint(point)) {
  				if (!(e.type === 'click' || e.type !== 'preclick') || !this._map._draggableMoved(layer)) {
  					clickedLayer = layer;
  				}
  			}
  		}
  		if (clickedLayer)  {
  			fakeStop(e);
  			this._fireEvent([clickedLayer], e);
  		}
  	},

  	_onMouseMove: function (e) {
  		if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) { return; }

  		var point = this._map.mouseEventToLayerPoint(e);
  		this._handleMouseHover(e, point);
  	},


  	_handleMouseOut: function (e) {
  		var layer = this._hoveredLayer;
  		if (layer) {
  			// if we're leaving the layer, fire mouseout
  			removeClass(this._container, 'leaflet-interactive');
  			this._fireEvent([layer], e, 'mouseout');
  			this._hoveredLayer = null;
  			this._mouseHoverThrottled = false;
  		}
  	},

  	_handleMouseHover: function (e, point) {
  		if (this._mouseHoverThrottled) {
  			return;
  		}

  		var layer, candidateHoveredLayer;

  		for (var order = this._drawFirst; order; order = order.next) {
  			layer = order.layer;
  			if (layer.options.interactive && layer._containsPoint(point)) {
  				candidateHoveredLayer = layer;
  			}
  		}

  		if (candidateHoveredLayer !== this._hoveredLayer) {
  			this._handleMouseOut(e);

  			if (candidateHoveredLayer) {
  				addClass(this._container, 'leaflet-interactive'); // change cursor
  				this._fireEvent([candidateHoveredLayer], e, 'mouseover');
  				this._hoveredLayer = candidateHoveredLayer;
  			}
  		}

  		if (this._hoveredLayer) {
  			this._fireEvent([this._hoveredLayer], e);
  		}

  		this._mouseHoverThrottled = true;
  		setTimeout(bind(function () {
  			this._mouseHoverThrottled = false;
  		}, this), 32);
  	},

  	_fireEvent: function (layers, e, type) {
  		this._map._fireDOMEvent(e, type || e.type, layers);
  	},

  	_bringToFront: function (layer) {
  		var order = layer._order;

  		if (!order) { return; }

  		var next = order.next;
  		var prev = order.prev;

  		if (next) {
  			next.prev = prev;
  		} else {
  			// Already last
  			return;
  		}
  		if (prev) {
  			prev.next = next;
  		} else if (next) {
  			// Update first entry unless this is the
  			// single entry
  			this._drawFirst = next;
  		}

  		order.prev = this._drawLast;
  		this._drawLast.next = order;

  		order.next = null;
  		this._drawLast = order;

  		this._requestRedraw(layer);
  	},

  	_bringToBack: function (layer) {
  		var order = layer._order;

  		if (!order) { return; }

  		var next = order.next;
  		var prev = order.prev;

  		if (prev) {
  			prev.next = next;
  		} else {
  			// Already first
  			return;
  		}
  		if (next) {
  			next.prev = prev;
  		} else if (prev) {
  			// Update last entry unless this is the
  			// single entry
  			this._drawLast = prev;
  		}

  		order.prev = null;

  		order.next = this._drawFirst;
  		this._drawFirst.prev = order;
  		this._drawFirst = order;

  		this._requestRedraw(layer);
  	}
  });

  // @factory L.canvas(options?: Renderer options)
  // Creates a Canvas renderer with the given options.
  function canvas$1(options) {
  	return canvas ? new Canvas(options) : null;
  }

  /*
   * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
   */


  var vmlCreate = (function () {
  	try {
  		document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
  		return function (name) {
  			return document.createElement('<lvml:' + name + ' class="lvml">');
  		};
  	} catch (e) {
  		return function (name) {
  			return document.createElement('<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
  		};
  	}
  })();


  /*
   * @class SVG
   *
   *
   * VML was deprecated in 2012, which means VML functionality exists only for backwards compatibility
   * with old versions of Internet Explorer.
   */

  // mixin to redefine some SVG methods to handle VML syntax which is similar but with some differences
  var vmlMixin = {

  	_initContainer: function () {
  		this._container = create$1('div', 'leaflet-vml-container');
  	},

  	_update: function () {
  		if (this._map._animatingZoom) { return; }
  		Renderer.prototype._update.call(this);
  		this.fire('update');
  	},

  	_initPath: function (layer) {
  		var container = layer._container = vmlCreate('shape');

  		addClass(container, 'leaflet-vml-shape ' + (this.options.className || ''));

  		container.coordsize = '1 1';

  		layer._path = vmlCreate('path');
  		container.appendChild(layer._path);

  		this._updateStyle(layer);
  		this._layers[stamp(layer)] = layer;
  	},

  	_addPath: function (layer) {
  		var container = layer._container;
  		this._container.appendChild(container);

  		if (layer.options.interactive) {
  			layer.addInteractiveTarget(container);
  		}
  	},

  	_removePath: function (layer) {
  		var container = layer._container;
  		remove(container);
  		layer.removeInteractiveTarget(container);
  		delete this._layers[stamp(layer)];
  	},

  	_updateStyle: function (layer) {
  		var stroke = layer._stroke,
  		    fill = layer._fill,
  		    options = layer.options,
  		    container = layer._container;

  		container.stroked = !!options.stroke;
  		container.filled = !!options.fill;

  		if (options.stroke) {
  			if (!stroke) {
  				stroke = layer._stroke = vmlCreate('stroke');
  			}
  			container.appendChild(stroke);
  			stroke.weight = options.weight + 'px';
  			stroke.color = options.color;
  			stroke.opacity = options.opacity;

  			if (options.dashArray) {
  				stroke.dashStyle = isArray(options.dashArray) ?
  				    options.dashArray.join(' ') :
  				    options.dashArray.replace(/( *, *)/g, ' ');
  			} else {
  				stroke.dashStyle = '';
  			}
  			stroke.endcap = options.lineCap.replace('butt', 'flat');
  			stroke.joinstyle = options.lineJoin;

  		} else if (stroke) {
  			container.removeChild(stroke);
  			layer._stroke = null;
  		}

  		if (options.fill) {
  			if (!fill) {
  				fill = layer._fill = vmlCreate('fill');
  			}
  			container.appendChild(fill);
  			fill.color = options.fillColor || options.color;
  			fill.opacity = options.fillOpacity;

  		} else if (fill) {
  			container.removeChild(fill);
  			layer._fill = null;
  		}
  	},

  	_updateCircle: function (layer) {
  		var p = layer._point.round(),
  		    r = Math.round(layer._radius),
  		    r2 = Math.round(layer._radiusY || r);

  		this._setPath(layer, layer._empty() ? 'M0 0' :
  			'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r2 + ' 0,' + (65535 * 360));
  	},

  	_setPath: function (layer, path) {
  		layer._path.v = path;
  	},

  	_bringToFront: function (layer) {
  		toFront(layer._container);
  	},

  	_bringToBack: function (layer) {
  		toBack(layer._container);
  	}
  };

  var create$2 = vml ? vmlCreate : svgCreate;

  /*
   * @class SVG
   * @inherits Renderer
   * @aka L.SVG
   *
   * Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
   * Inherits `Renderer`.
   *
   * Due to [technical limitations](http://caniuse.com/#search=svg), SVG is not
   * available in all web browsers, notably Android 2.x and 3.x.
   *
   * Although SVG is not available on IE7 and IE8, these browsers support
   * [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language)
   * (a now deprecated technology), and the SVG renderer will fall back to VML in
   * this case.
   *
   * @example
   *
   * Use SVG by default for all paths in the map:
   *
   * ```js
   * var map = L.map('map', {
   * 	renderer: L.svg()
   * });
   * ```
   *
   * Use a SVG renderer with extra padding for specific vector geometries:
   *
   * ```js
   * var map = L.map('map');
   * var myRenderer = L.svg({ padding: 0.5 });
   * var line = L.polyline( coordinates, { renderer: myRenderer } );
   * var circle = L.circle( center, { renderer: myRenderer } );
   * ```
   */

  var SVG = Renderer.extend({

  	getEvents: function () {
  		var events = Renderer.prototype.getEvents.call(this);
  		events.zoomstart = this._onZoomStart;
  		return events;
  	},

  	_initContainer: function () {
  		this._container = create$2('svg');

  		// makes it possible to click through svg root; we'll reset it back in individual paths
  		this._container.setAttribute('pointer-events', 'none');

  		this._rootGroup = create$2('g');
  		this._container.appendChild(this._rootGroup);
  	},

  	_destroyContainer: function () {
  		remove(this._container);
  		off(this._container);
  		delete this._container;
  		delete this._rootGroup;
  		delete this._svgSize;
  	},

  	_onZoomStart: function () {
  		// Drag-then-pinch interactions might mess up the center and zoom.
  		// In this case, the easiest way to prevent this is re-do the renderer
  		//   bounds and padding when the zooming starts.
  		this._update();
  	},

  	_update: function () {
  		if (this._map._animatingZoom && this._bounds) { return; }

  		Renderer.prototype._update.call(this);

  		var b = this._bounds,
  		    size = b.getSize(),
  		    container = this._container;

  		// set size of svg-container if changed
  		if (!this._svgSize || !this._svgSize.equals(size)) {
  			this._svgSize = size;
  			container.setAttribute('width', size.x);
  			container.setAttribute('height', size.y);
  		}

  		// movement: update container viewBox so that we don't have to change coordinates of individual layers
  		setPosition(container, b.min);
  		container.setAttribute('viewBox', [b.min.x, b.min.y, size.x, size.y].join(' '));

  		this.fire('update');
  	},

  	// methods below are called by vector layers implementations

  	_initPath: function (layer) {
  		var path = layer._path = create$2('path');

  		// @namespace Path
  		// @option className: String = null
  		// Custom class name set on an element. Only for SVG renderer.
  		if (layer.options.className) {
  			addClass(path, layer.options.className);
  		}

  		if (layer.options.interactive) {
  			addClass(path, 'leaflet-interactive');
  		}

  		this._updateStyle(layer);
  		this._layers[stamp(layer)] = layer;
  	},

  	_addPath: function (layer) {
  		if (!this._rootGroup) { this._initContainer(); }
  		this._rootGroup.appendChild(layer._path);
  		layer.addInteractiveTarget(layer._path);
  	},

  	_removePath: function (layer) {
  		remove(layer._path);
  		layer.removeInteractiveTarget(layer._path);
  		delete this._layers[stamp(layer)];
  	},

  	_updatePath: function (layer) {
  		layer._project();
  		layer._update();
  	},

  	_updateStyle: function (layer) {
  		var path = layer._path,
  		    options = layer.options;

  		if (!path) { return; }

  		if (options.stroke) {
  			path.setAttribute('stroke', options.color);
  			path.setAttribute('stroke-opacity', options.opacity);
  			path.setAttribute('stroke-width', options.weight);
  			path.setAttribute('stroke-linecap', options.lineCap);
  			path.setAttribute('stroke-linejoin', options.lineJoin);

  			if (options.dashArray) {
  				path.setAttribute('stroke-dasharray', options.dashArray);
  			} else {
  				path.removeAttribute('stroke-dasharray');
  			}

  			if (options.dashOffset) {
  				path.setAttribute('stroke-dashoffset', options.dashOffset);
  			} else {
  				path.removeAttribute('stroke-dashoffset');
  			}
  		} else {
  			path.setAttribute('stroke', 'none');
  		}

  		if (options.fill) {
  			path.setAttribute('fill', options.fillColor || options.color);
  			path.setAttribute('fill-opacity', options.fillOpacity);
  			path.setAttribute('fill-rule', options.fillRule || 'evenodd');
  		} else {
  			path.setAttribute('fill', 'none');
  		}
  	},

  	_updatePoly: function (layer, closed) {
  		this._setPath(layer, pointsToPath(layer._parts, closed));
  	},

  	_updateCircle: function (layer) {
  		var p = layer._point,
  		    r = Math.max(Math.round(layer._radius), 1),
  		    r2 = Math.max(Math.round(layer._radiusY), 1) || r,
  		    arc = 'a' + r + ',' + r2 + ' 0 1,0 ';

  		// drawing a circle with two half-arcs
  		var d = layer._empty() ? 'M0 0' :
  			'M' + (p.x - r) + ',' + p.y +
  			arc + (r * 2) + ',0 ' +
  			arc + (-r * 2) + ',0 ';

  		this._setPath(layer, d);
  	},

  	_setPath: function (layer, path) {
  		layer._path.setAttribute('d', path);
  	},

  	// SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
  	_bringToFront: function (layer) {
  		toFront(layer._path);
  	},

  	_bringToBack: function (layer) {
  		toBack(layer._path);
  	}
  });

  if (vml) {
  	SVG.include(vmlMixin);
  }

  // @namespace SVG
  // @factory L.svg(options?: Renderer options)
  // Creates a SVG renderer with the given options.
  function svg$1(options) {
  	return svg || vml ? new SVG(options) : null;
  }

  Map.include({
  	// @namespace Map; @method getRenderer(layer: Path): Renderer
  	// Returns the instance of `Renderer` that should be used to render the given
  	// `Path`. It will ensure that the `renderer` options of the map and paths
  	// are respected, and that the renderers do exist on the map.
  	getRenderer: function (layer) {
  		// @namespace Path; @option renderer: Renderer
  		// Use this specific instance of `Renderer` for this path. Takes
  		// precedence over the map's [default renderer](#map-renderer).
  		var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;

  		if (!renderer) {
  			renderer = this._renderer = this._createRenderer();
  		}

  		if (!this.hasLayer(renderer)) {
  			this.addLayer(renderer);
  		}
  		return renderer;
  	},

  	_getPaneRenderer: function (name) {
  		if (name === 'overlayPane' || name === undefined) {
  			return false;
  		}

  		var renderer = this._paneRenderers[name];
  		if (renderer === undefined) {
  			renderer = this._createRenderer({pane: name});
  			this._paneRenderers[name] = renderer;
  		}
  		return renderer;
  	},

  	_createRenderer: function (options) {
  		// @namespace Map; @option preferCanvas: Boolean = false
  		// Whether `Path`s should be rendered on a `Canvas` renderer.
  		// By default, all `Path`s are rendered in a `SVG` renderer.
  		return (this.options.preferCanvas && canvas$1(options)) || svg$1(options);
  	}
  });

  /*
   * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
   */

  /*
   * @class Rectangle
   * @aka L.Rectangle
   * @inherits Polygon
   *
   * A class for drawing rectangle overlays on a map. Extends `Polygon`.
   *
   * @example
   *
   * ```js
   * // define rectangle geographical bounds
   * var bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
   *
   * // create an orange rectangle
   * L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
   *
   * // zoom the map to the rectangle bounds
   * map.fitBounds(bounds);
   * ```
   *
   */


  var Rectangle = Polygon.extend({
  	initialize: function (latLngBounds, options) {
  		Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
  	},

  	// @method setBounds(latLngBounds: LatLngBounds): this
  	// Redraws the rectangle with the passed bounds.
  	setBounds: function (latLngBounds) {
  		return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
  	},

  	_boundsToLatLngs: function (latLngBounds) {
  		latLngBounds = toLatLngBounds(latLngBounds);
  		return [
  			latLngBounds.getSouthWest(),
  			latLngBounds.getNorthWest(),
  			latLngBounds.getNorthEast(),
  			latLngBounds.getSouthEast()
  		];
  	}
  });


  // @factory L.rectangle(latLngBounds: LatLngBounds, options?: Polyline options)
  function rectangle(latLngBounds, options) {
  	return new Rectangle(latLngBounds, options);
  }

  SVG.create = create$2;
  SVG.pointsToPath = pointsToPath;

  GeoJSON.geometryToLayer = geometryToLayer;
  GeoJSON.coordsToLatLng = coordsToLatLng;
  GeoJSON.coordsToLatLngs = coordsToLatLngs;
  GeoJSON.latLngToCoords = latLngToCoords;
  GeoJSON.latLngsToCoords = latLngsToCoords;
  GeoJSON.getFeature = getFeature;
  GeoJSON.asFeature = asFeature;

  /*
   * L.Handler.BoxZoom is used to add shift-drag zoom interaction to the map
   * (zoom to a selected bounding box), enabled by default.
   */

  // @namespace Map
  // @section Interaction Options
  Map.mergeOptions({
  	// @option boxZoom: Boolean = true
  	// Whether the map can be zoomed to a rectangular area specified by
  	// dragging the mouse while pressing the shift key.
  	boxZoom: true
  });

  var BoxZoom = Handler.extend({
  	initialize: function (map) {
  		this._map = map;
  		this._container = map._container;
  		this._pane = map._panes.overlayPane;
  		this._resetStateTimeout = 0;
  		map.on('unload', this._destroy, this);
  	},

  	addHooks: function () {
  		on(this._container, 'mousedown', this._onMouseDown, this);
  	},

  	removeHooks: function () {
  		off(this._container, 'mousedown', this._onMouseDown, this);
  	},

  	moved: function () {
  		return this._moved;
  	},

  	_destroy: function () {
  		remove(this._pane);
  		delete this._pane;
  	},

  	_resetState: function () {
  		this._resetStateTimeout = 0;
  		this._moved = false;
  	},

  	_clearDeferredResetState: function () {
  		if (this._resetStateTimeout !== 0) {
  			clearTimeout(this._resetStateTimeout);
  			this._resetStateTimeout = 0;
  		}
  	},

  	_onMouseDown: function (e) {
  		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

  		// Clear the deferred resetState if it hasn't executed yet, otherwise it
  		// will interrupt the interaction and orphan a box element in the container.
  		this._clearDeferredResetState();
  		this._resetState();

  		disableTextSelection();
  		disableImageDrag();

  		this._startPoint = this._map.mouseEventToContainerPoint(e);

  		on(document, {
  			contextmenu: stop,
  			mousemove: this._onMouseMove,
  			mouseup: this._onMouseUp,
  			keydown: this._onKeyDown
  		}, this);
  	},

  	_onMouseMove: function (e) {
  		if (!this._moved) {
  			this._moved = true;

  			this._box = create$1('div', 'leaflet-zoom-box', this._container);
  			addClass(this._container, 'leaflet-crosshair');

  			this._map.fire('boxzoomstart');
  		}

  		this._point = this._map.mouseEventToContainerPoint(e);

  		var bounds = new Bounds(this._point, this._startPoint),
  		    size = bounds.getSize();

  		setPosition(this._box, bounds.min);

  		this._box.style.width  = size.x + 'px';
  		this._box.style.height = size.y + 'px';
  	},

  	_finish: function () {
  		if (this._moved) {
  			remove(this._box);
  			removeClass(this._container, 'leaflet-crosshair');
  		}

  		enableTextSelection();
  		enableImageDrag();

  		off(document, {
  			contextmenu: stop,
  			mousemove: this._onMouseMove,
  			mouseup: this._onMouseUp,
  			keydown: this._onKeyDown
  		}, this);
  	},

  	_onMouseUp: function (e) {
  		if ((e.which !== 1) && (e.button !== 1)) { return; }

  		this._finish();

  		if (!this._moved) { return; }
  		// Postpone to next JS tick so internal click event handling
  		// still see it as "moved".
  		this._clearDeferredResetState();
  		this._resetStateTimeout = setTimeout(bind(this._resetState, this), 0);

  		var bounds = new LatLngBounds(
  		        this._map.containerPointToLatLng(this._startPoint),
  		        this._map.containerPointToLatLng(this._point));

  		this._map
  			.fitBounds(bounds)
  			.fire('boxzoomend', {boxZoomBounds: bounds});
  	},

  	_onKeyDown: function (e) {
  		if (e.keyCode === 27) {
  			this._finish();
  		}
  	}
  });

  // @section Handlers
  // @property boxZoom: Handler
  // Box (shift-drag with mouse) zoom handler.
  Map.addInitHook('addHandler', 'boxZoom', BoxZoom);

  /*
   * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
   */

  // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
  	// @option doubleClickZoom: Boolean|String = true
  	// Whether the map can be zoomed in by double clicking on it and
  	// zoomed out by double clicking while holding shift. If passed
  	// `'center'`, double-click zoom will zoom to the center of the
  	//  view regardless of where the mouse was.
  	doubleClickZoom: true
  });

  var DoubleClickZoom = Handler.extend({
  	addHooks: function () {
  		this._map.on('dblclick', this._onDoubleClick, this);
  	},

  	removeHooks: function () {
  		this._map.off('dblclick', this._onDoubleClick, this);
  	},

  	_onDoubleClick: function (e) {
  		var map = this._map,
  		    oldZoom = map.getZoom(),
  		    delta = map.options.zoomDelta,
  		    zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

  		if (map.options.doubleClickZoom === 'center') {
  			map.setZoom(zoom);
  		} else {
  			map.setZoomAround(e.containerPoint, zoom);
  		}
  	}
  });

  // @section Handlers
  //
  // Map properties include interaction handlers that allow you to control
  // interaction behavior in runtime, enabling or disabling certain features such
  // as dragging or touch zoom (see `Handler` methods). For example:
  //
  // ```js
  // map.doubleClickZoom.disable();
  // ```
  //
  // @property doubleClickZoom: Handler
  // Double click zoom handler.
  Map.addInitHook('addHandler', 'doubleClickZoom', DoubleClickZoom);

  /*
   * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
   */

  // @namespace Map
  // @section Interaction Options
  Map.mergeOptions({
  	// @option dragging: Boolean = true
  	// Whether the map be draggable with mouse/touch or not.
  	dragging: true,

  	// @section Panning Inertia Options
  	// @option inertia: Boolean = *
  	// If enabled, panning of the map will have an inertia effect where
  	// the map builds momentum while dragging and continues moving in
  	// the same direction for some time. Feels especially nice on touch
  	// devices. Enabled by default unless running on old Android devices.
  	inertia: !android23,

  	// @option inertiaDeceleration: Number = 3000
  	// The rate with which the inertial movement slows down, in pixels/second².
  	inertiaDeceleration: 3400, // px/s^2

  	// @option inertiaMaxSpeed: Number = Infinity
  	// Max speed of the inertial movement, in pixels/second.
  	inertiaMaxSpeed: Infinity, // px/s

  	// @option easeLinearity: Number = 0.2
  	easeLinearity: 0.2,

  	// TODO refactor, move to CRS
  	// @option worldCopyJump: Boolean = false
  	// With this option enabled, the map tracks when you pan to another "copy"
  	// of the world and seamlessly jumps to the original one so that all overlays
  	// like markers and vector layers are still visible.
  	worldCopyJump: false,

  	// @option maxBoundsViscosity: Number = 0.0
  	// If `maxBounds` is set, this option will control how solid the bounds
  	// are when dragging the map around. The default value of `0.0` allows the
  	// user to drag outside the bounds at normal speed, higher values will
  	// slow down map dragging outside bounds, and `1.0` makes the bounds fully
  	// solid, preventing the user from dragging outside the bounds.
  	maxBoundsViscosity: 0.0
  });

  var Drag = Handler.extend({
  	addHooks: function () {
  		if (!this._draggable) {
  			var map = this._map;

  			this._draggable = new Draggable(map._mapPane, map._container);

  			this._draggable.on({
  				dragstart: this._onDragStart,
  				drag: this._onDrag,
  				dragend: this._onDragEnd
  			}, this);

  			this._draggable.on('predrag', this._onPreDragLimit, this);
  			if (map.options.worldCopyJump) {
  				this._draggable.on('predrag', this._onPreDragWrap, this);
  				map.on('zoomend', this._onZoomEnd, this);

  				map.whenReady(this._onZoomEnd, this);
  			}
  		}
  		addClass(this._map._container, 'leaflet-grab leaflet-touch-drag');
  		this._draggable.enable();
  		this._positions = [];
  		this._times = [];
  	},

  	removeHooks: function () {
  		removeClass(this._map._container, 'leaflet-grab');
  		removeClass(this._map._container, 'leaflet-touch-drag');
  		this._draggable.disable();
  	},

  	moved: function () {
  		return this._draggable && this._draggable._moved;
  	},

  	moving: function () {
  		return this._draggable && this._draggable._moving;
  	},

  	_onDragStart: function () {
  		var map = this._map;

  		map._stop();
  		if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
  			var bounds = toLatLngBounds(this._map.options.maxBounds);

  			this._offsetLimit = toBounds(
  				this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
  				this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1)
  					.add(this._map.getSize()));

  			this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
  		} else {
  			this._offsetLimit = null;
  		}

  		map
  		    .fire('movestart')
  		    .fire('dragstart');

  		if (map.options.inertia) {
  			this._positions = [];
  			this._times = [];
  		}
  	},

  	_onDrag: function (e) {
  		if (this._map.options.inertia) {
  			var time = this._lastTime = +new Date(),
  			    pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

  			this._positions.push(pos);
  			this._times.push(time);

  			this._prunePositions(time);
  		}

  		this._map
  		    .fire('move', e)
  		    .fire('drag', e);
  	},

  	_prunePositions: function (time) {
  		while (this._positions.length > 1 && time - this._times[0] > 50) {
  			this._positions.shift();
  			this._times.shift();
  		}
  	},

  	_onZoomEnd: function () {
  		var pxCenter = this._map.getSize().divideBy(2),
  		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

  		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
  		this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
  	},

  	_viscousLimit: function (value, threshold) {
  		return value - (value - threshold) * this._viscosity;
  	},

  	_onPreDragLimit: function () {
  		if (!this._viscosity || !this._offsetLimit) { return; }

  		var offset = this._draggable._newPos.subtract(this._draggable._startPos);

  		var limit = this._offsetLimit;
  		if (offset.x < limit.min.x) { offset.x = this._viscousLimit(offset.x, limit.min.x); }
  		if (offset.y < limit.min.y) { offset.y = this._viscousLimit(offset.y, limit.min.y); }
  		if (offset.x > limit.max.x) { offset.x = this._viscousLimit(offset.x, limit.max.x); }
  		if (offset.y > limit.max.y) { offset.y = this._viscousLimit(offset.y, limit.max.y); }

  		this._draggable._newPos = this._draggable._startPos.add(offset);
  	},

  	_onPreDragWrap: function () {
  		// TODO refactor to be able to adjust map pane position after zoom
  		var worldWidth = this._worldWidth,
  		    halfWidth = Math.round(worldWidth / 2),
  		    dx = this._initialWorldOffset,
  		    x = this._draggable._newPos.x,
  		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
  		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
  		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

  		this._draggable._absPos = this._draggable._newPos.clone();
  		this._draggable._newPos.x = newX;
  	},

  	_onDragEnd: function (e) {
  		var map = this._map,
  		    options = map.options,

  		    noInertia = !options.inertia || this._times.length < 2;

  		map.fire('dragend', e);

  		if (noInertia) {
  			map.fire('moveend');

  		} else {
  			this._prunePositions(+new Date());

  			var direction = this._lastPos.subtract(this._positions[0]),
  			    duration = (this._lastTime - this._times[0]) / 1000,
  			    ease = options.easeLinearity,

  			    speedVector = direction.multiplyBy(ease / duration),
  			    speed = speedVector.distanceTo([0, 0]),

  			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
  			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

  			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
  			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

  			if (!offset.x && !offset.y) {
  				map.fire('moveend');

  			} else {
  				offset = map._limitOffset(offset, map.options.maxBounds);

  				requestAnimFrame(function () {
  					map.panBy(offset, {
  						duration: decelerationDuration,
  						easeLinearity: ease,
  						noMoveStart: true,
  						animate: true
  					});
  				});
  			}
  		}
  	}
  });

  // @section Handlers
  // @property dragging: Handler
  // Map dragging handler (by both mouse and touch).
  Map.addInitHook('addHandler', 'dragging', Drag);

  /*
   * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
   */

  // @namespace Map
  // @section Keyboard Navigation Options
  Map.mergeOptions({
  	// @option keyboard: Boolean = true
  	// Makes the map focusable and allows users to navigate the map with keyboard
  	// arrows and `+`/`-` keys.
  	keyboard: true,

  	// @option keyboardPanDelta: Number = 80
  	// Amount of pixels to pan when pressing an arrow key.
  	keyboardPanDelta: 80
  });

  var Keyboard = Handler.extend({

  	keyCodes: {
  		left:    [37],
  		right:   [39],
  		down:    [40],
  		up:      [38],
  		zoomIn:  [187, 107, 61, 171],
  		zoomOut: [189, 109, 54, 173]
  	},

  	initialize: function (map) {
  		this._map = map;

  		this._setPanDelta(map.options.keyboardPanDelta);
  		this._setZoomDelta(map.options.zoomDelta);
  	},

  	addHooks: function () {
  		var container = this._map._container;

  		// make the container focusable by tabbing
  		if (container.tabIndex <= 0) {
  			container.tabIndex = '0';
  		}

  		on(container, {
  			focus: this._onFocus,
  			blur: this._onBlur,
  			mousedown: this._onMouseDown
  		}, this);

  		this._map.on({
  			focus: this._addHooks,
  			blur: this._removeHooks
  		}, this);
  	},

  	removeHooks: function () {
  		this._removeHooks();

  		off(this._map._container, {
  			focus: this._onFocus,
  			blur: this._onBlur,
  			mousedown: this._onMouseDown
  		}, this);

  		this._map.off({
  			focus: this._addHooks,
  			blur: this._removeHooks
  		}, this);
  	},

  	_onMouseDown: function () {
  		if (this._focused) { return; }

  		var body = document.body,
  		    docEl = document.documentElement,
  		    top = body.scrollTop || docEl.scrollTop,
  		    left = body.scrollLeft || docEl.scrollLeft;

  		this._map._container.focus();

  		window.scrollTo(left, top);
  	},

  	_onFocus: function () {
  		this._focused = true;
  		this._map.fire('focus');
  	},

  	_onBlur: function () {
  		this._focused = false;
  		this._map.fire('blur');
  	},

  	_setPanDelta: function (panDelta) {
  		var keys = this._panKeys = {},
  		    codes = this.keyCodes,
  		    i, len;

  		for (i = 0, len = codes.left.length; i < len; i++) {
  			keys[codes.left[i]] = [-1 * panDelta, 0];
  		}
  		for (i = 0, len = codes.right.length; i < len; i++) {
  			keys[codes.right[i]] = [panDelta, 0];
  		}
  		for (i = 0, len = codes.down.length; i < len; i++) {
  			keys[codes.down[i]] = [0, panDelta];
  		}
  		for (i = 0, len = codes.up.length; i < len; i++) {
  			keys[codes.up[i]] = [0, -1 * panDelta];
  		}
  	},

  	_setZoomDelta: function (zoomDelta) {
  		var keys = this._zoomKeys = {},
  		    codes = this.keyCodes,
  		    i, len;

  		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
  			keys[codes.zoomIn[i]] = zoomDelta;
  		}
  		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
  			keys[codes.zoomOut[i]] = -zoomDelta;
  		}
  	},

  	_addHooks: function () {
  		on(document, 'keydown', this._onKeyDown, this);
  	},

  	_removeHooks: function () {
  		off(document, 'keydown', this._onKeyDown, this);
  	},

  	_onKeyDown: function (e) {
  		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

  		var key = e.keyCode,
  		    map = this._map,
  		    offset;

  		if (key in this._panKeys) {
  			if (!map._panAnim || !map._panAnim._inProgress) {
  				offset = this._panKeys[key];
  				if (e.shiftKey) {
  					offset = toPoint(offset).multiplyBy(3);
  				}

  				map.panBy(offset);

  				if (map.options.maxBounds) {
  					map.panInsideBounds(map.options.maxBounds);
  				}
  			}
  		} else if (key in this._zoomKeys) {
  			map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);

  		} else if (key === 27 && map._popup && map._popup.options.closeOnEscapeKey) {
  			map.closePopup();

  		} else {
  			return;
  		}

  		stop(e);
  	}
  });

  // @section Handlers
  // @section Handlers
  // @property keyboard: Handler
  // Keyboard navigation handler.
  Map.addInitHook('addHandler', 'keyboard', Keyboard);

  /*
   * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
   */

  // @namespace Map
  // @section Interaction Options
  Map.mergeOptions({
  	// @section Mouse wheel options
  	// @option scrollWheelZoom: Boolean|String = true
  	// Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
  	// it will zoom to the center of the view regardless of where the mouse was.
  	scrollWheelZoom: true,

  	// @option wheelDebounceTime: Number = 40
  	// Limits the rate at which a wheel can fire (in milliseconds). By default
  	// user can't zoom via wheel more often than once per 40 ms.
  	wheelDebounceTime: 40,

  	// @option wheelPxPerZoomLevel: Number = 60
  	// How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
  	// mean a change of one full zoom level. Smaller values will make wheel-zooming
  	// faster (and vice versa).
  	wheelPxPerZoomLevel: 60
  });

  var ScrollWheelZoom = Handler.extend({
  	addHooks: function () {
  		on(this._map._container, 'wheel', this._onWheelScroll, this);

  		this._delta = 0;
  	},

  	removeHooks: function () {
  		off(this._map._container, 'wheel', this._onWheelScroll, this);
  	},

  	_onWheelScroll: function (e) {
  		var delta = getWheelDelta(e);

  		var debounce = this._map.options.wheelDebounceTime;

  		this._delta += delta;
  		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

  		if (!this._startTime) {
  			this._startTime = +new Date();
  		}

  		var left = Math.max(debounce - (+new Date() - this._startTime), 0);

  		clearTimeout(this._timer);
  		this._timer = setTimeout(bind(this._performZoom, this), left);

  		stop(e);
  	},

  	_performZoom: function () {
  		var map = this._map,
  		    zoom = map.getZoom(),
  		    snap = this._map.options.zoomSnap || 0;

  		map._stop(); // stop panning and fly animations if any

  		// map the delta with a sigmoid function to -4..4 range leaning on -1..1
  		var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4),
  		    d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
  		    d4 = snap ? Math.ceil(d3 / snap) * snap : d3,
  		    delta = map._limitZoom(zoom + (this._delta > 0 ? d4 : -d4)) - zoom;

  		this._delta = 0;
  		this._startTime = null;

  		if (!delta) { return; }

  		if (map.options.scrollWheelZoom === 'center') {
  			map.setZoom(zoom + delta);
  		} else {
  			map.setZoomAround(this._lastMousePos, zoom + delta);
  		}
  	}
  });

  // @section Handlers
  // @property scrollWheelZoom: Handler
  // Scroll wheel zoom handler.
  Map.addInitHook('addHandler', 'scrollWheelZoom', ScrollWheelZoom);

  /*
   * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
   */

  // @namespace Map
  // @section Interaction Options
  Map.mergeOptions({
  	// @section Touch interaction options
  	// @option tap: Boolean = true
  	// Enables mobile hacks for supporting instant taps (fixing 200ms click
  	// delay on iOS/Android) and touch holds (fired as `contextmenu` events).
  	tap: true,

  	// @option tapTolerance: Number = 15
  	// The max number of pixels a user can shift his finger during touch
  	// for it to be considered a valid tap.
  	tapTolerance: 15
  });

  var Tap = Handler.extend({
  	addHooks: function () {
  		on(this._map._container, 'touchstart', this._onDown, this);
  	},

  	removeHooks: function () {
  		off(this._map._container, 'touchstart', this._onDown, this);
  	},

  	_onDown: function (e) {
  		if (!e.touches) { return; }

  		preventDefault(e);

  		this._fireClick = true;

  		// don't simulate click or track longpress if more than 1 touch
  		if (e.touches.length > 1) {
  			this._fireClick = false;
  			clearTimeout(this._holdTimeout);
  			return;
  		}

  		var first = e.touches[0],
  		    el = first.target;

  		this._startPos = this._newPos = new Point(first.clientX, first.clientY);

  		// if touching a link, highlight it
  		if (el.tagName && el.tagName.toLowerCase() === 'a') {
  			addClass(el, 'leaflet-active');
  		}

  		// simulate long hold but setting a timeout
  		this._holdTimeout = setTimeout(bind(function () {
  			if (this._isTapValid()) {
  				this._fireClick = false;
  				this._onUp();
  				this._simulateEvent('contextmenu', first);
  			}
  		}, this), 1000);

  		this._simulateEvent('mousedown', first);

  		on(document, {
  			touchmove: this._onMove,
  			touchend: this._onUp
  		}, this);
  	},

  	_onUp: function (e) {
  		clearTimeout(this._holdTimeout);

  		off(document, {
  			touchmove: this._onMove,
  			touchend: this._onUp
  		}, this);

  		if (this._fireClick && e && e.changedTouches) {

  			var first = e.changedTouches[0],
  			    el = first.target;

  			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
  				removeClass(el, 'leaflet-active');
  			}

  			this._simulateEvent('mouseup', first);

  			// simulate click if the touch didn't move too much
  			if (this._isTapValid()) {
  				this._simulateEvent('click', first);
  			}
  		}
  	},

  	_isTapValid: function () {
  		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
  	},

  	_onMove: function (e) {
  		var first = e.touches[0];
  		this._newPos = new Point(first.clientX, first.clientY);
  		this._simulateEvent('mousemove', first);
  	},

  	_simulateEvent: function (type, e) {
  		var simulatedEvent = document.createEvent('MouseEvents');

  		simulatedEvent._simulated = true;
  		e.target._simulatedClick = true;

  		simulatedEvent.initMouseEvent(
  		        type, true, true, window, 1,
  		        e.screenX, e.screenY,
  		        e.clientX, e.clientY,
  		        false, false, false, false, 0, null);

  		e.target.dispatchEvent(simulatedEvent);
  	}
  });

  // @section Handlers
  // @property tap: Handler
  // Mobile touch hacks (quick tap and touch hold) handler.
  if (touch && (!pointer || safari)) {
  	Map.addInitHook('addHandler', 'tap', Tap);
  }

  /*
   * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
   */

  // @namespace Map
  // @section Interaction Options
  Map.mergeOptions({
  	// @section Touch interaction options
  	// @option touchZoom: Boolean|String = *
  	// Whether the map can be zoomed by touch-dragging with two fingers. If
  	// passed `'center'`, it will zoom to the center of the view regardless of
  	// where the touch events (fingers) were. Enabled for touch-capable web
  	// browsers except for old Androids.
  	touchZoom: touch && !android23,

  	// @option bounceAtZoomLimits: Boolean = true
  	// Set it to false if you don't want the map to zoom beyond min/max zoom
  	// and then bounce back when pinch-zooming.
  	bounceAtZoomLimits: true
  });

  var TouchZoom = Handler.extend({
  	addHooks: function () {
  		addClass(this._map._container, 'leaflet-touch-zoom');
  		on(this._map._container, 'touchstart', this._onTouchStart, this);
  	},

  	removeHooks: function () {
  		removeClass(this._map._container, 'leaflet-touch-zoom');
  		off(this._map._container, 'touchstart', this._onTouchStart, this);
  	},

  	_onTouchStart: function (e) {
  		var map = this._map;
  		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

  		var p1 = map.mouseEventToContainerPoint(e.touches[0]),
  		    p2 = map.mouseEventToContainerPoint(e.touches[1]);

  		this._centerPoint = map.getSize()._divideBy(2);
  		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
  		if (map.options.touchZoom !== 'center') {
  			this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
  		}

  		this._startDist = p1.distanceTo(p2);
  		this._startZoom = map.getZoom();

  		this._moved = false;
  		this._zooming = true;

  		map._stop();

  		on(document, 'touchmove', this._onTouchMove, this);
  		on(document, 'touchend', this._onTouchEnd, this);

  		preventDefault(e);
  	},

  	_onTouchMove: function (e) {
  		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

  		var map = this._map,
  		    p1 = map.mouseEventToContainerPoint(e.touches[0]),
  		    p2 = map.mouseEventToContainerPoint(e.touches[1]),
  		    scale = p1.distanceTo(p2) / this._startDist;

  		this._zoom = map.getScaleZoom(scale, this._startZoom);

  		if (!map.options.bounceAtZoomLimits && (
  			(this._zoom < map.getMinZoom() && scale < 1) ||
  			(this._zoom > map.getMaxZoom() && scale > 1))) {
  			this._zoom = map._limitZoom(this._zoom);
  		}

  		if (map.options.touchZoom === 'center') {
  			this._center = this._startLatLng;
  			if (scale === 1) { return; }
  		} else {
  			// Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
  			var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
  			if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }
  			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
  		}

  		if (!this._moved) {
  			map._moveStart(true, false);
  			this._moved = true;
  		}

  		cancelAnimFrame(this._animRequest);

  		var moveFn = bind(map._move, map, this._center, this._zoom, {pinch: true, round: false});
  		this._animRequest = requestAnimFrame(moveFn, this, true);

  		preventDefault(e);
  	},

  	_onTouchEnd: function () {
  		if (!this._moved || !this._zooming) {
  			this._zooming = false;
  			return;
  		}

  		this._zooming = false;
  		cancelAnimFrame(this._animRequest);

  		off(document, 'touchmove', this._onTouchMove, this);
  		off(document, 'touchend', this._onTouchEnd, this);

  		// Pinch updates GridLayers' levels only when zoomSnap is off, so zoomSnap becomes noUpdate.
  		if (this._map.options.zoomAnimation) {
  			this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
  		} else {
  			this._map._resetView(this._center, this._map._limitZoom(this._zoom));
  		}
  	}
  });

  // @section Handlers
  // @property touchZoom: Handler
  // Touch zoom handler.
  Map.addInitHook('addHandler', 'touchZoom', TouchZoom);

  Map.BoxZoom = BoxZoom;
  Map.DoubleClickZoom = DoubleClickZoom;
  Map.Drag = Drag;
  Map.Keyboard = Keyboard;
  Map.ScrollWheelZoom = ScrollWheelZoom;
  Map.Tap = Tap;
  Map.TouchZoom = TouchZoom;

  exports.version = version;
  exports.Control = Control;
  exports.control = control;
  exports.Browser = Browser;
  exports.Evented = Evented;
  exports.Mixin = Mixin;
  exports.Util = Util;
  exports.Class = Class;
  exports.Handler = Handler;
  exports.extend = extend;
  exports.bind = bind;
  exports.stamp = stamp;
  exports.setOptions = setOptions;
  exports.DomEvent = DomEvent;
  exports.DomUtil = DomUtil;
  exports.PosAnimation = PosAnimation;
  exports.Draggable = Draggable;
  exports.LineUtil = LineUtil;
  exports.PolyUtil = PolyUtil;
  exports.Point = Point;
  exports.point = toPoint;
  exports.Bounds = Bounds;
  exports.bounds = toBounds;
  exports.Transformation = Transformation;
  exports.transformation = toTransformation;
  exports.Projection = index;
  exports.LatLng = LatLng;
  exports.latLng = toLatLng;
  exports.LatLngBounds = LatLngBounds;
  exports.latLngBounds = toLatLngBounds;
  exports.CRS = CRS;
  exports.GeoJSON = GeoJSON;
  exports.geoJSON = geoJSON;
  exports.geoJson = geoJson;
  exports.Layer = Layer;
  exports.LayerGroup = LayerGroup;
  exports.layerGroup = layerGroup;
  exports.FeatureGroup = FeatureGroup;
  exports.featureGroup = featureGroup;
  exports.ImageOverlay = ImageOverlay;
  exports.imageOverlay = imageOverlay;
  exports.VideoOverlay = VideoOverlay;
  exports.videoOverlay = videoOverlay;
  exports.SVGOverlay = SVGOverlay;
  exports.svgOverlay = svgOverlay;
  exports.DivOverlay = DivOverlay;
  exports.Popup = Popup;
  exports.popup = popup;
  exports.Tooltip = Tooltip;
  exports.tooltip = tooltip;
  exports.Icon = Icon;
  exports.icon = icon;
  exports.DivIcon = DivIcon;
  exports.divIcon = divIcon;
  exports.Marker = Marker;
  exports.marker = marker;
  exports.TileLayer = TileLayer;
  exports.tileLayer = tileLayer;
  exports.GridLayer = GridLayer;
  exports.gridLayer = gridLayer;
  exports.SVG = SVG;
  exports.svg = svg$1;
  exports.Renderer = Renderer;
  exports.Canvas = Canvas;
  exports.canvas = canvas$1;
  exports.Path = Path;
  exports.CircleMarker = CircleMarker;
  exports.circleMarker = circleMarker;
  exports.Circle = Circle;
  exports.circle = circle;
  exports.Polyline = Polyline;
  exports.polyline = polyline;
  exports.Polygon = Polygon;
  exports.polygon = polygon;
  exports.Rectangle = Rectangle;
  exports.rectangle = rectangle;
  exports.Map = Map;
  exports.map = createMap;

  var oldL = window.L;
  exports.noConflict = function() {
  	window.L = oldL;
  	return this;
  }

  // Always export us to window global (see #2364)
  window.L = exports;

})));


},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/datdot-wallet.js":[function(require,module,exports){
const make_grid = require('make-grid')
const message_maker = require('message-maker')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
// components
const i_container = require('container')
const i_footer = require('footer')

module.exports = wallet

// accounts option
const path = 'https://avatars.dicebear.com/api/bottts'
const accounts_list_theme = {
  props: {
    icon_size: '24px',
    icon_size_hover: '24px',
    current_icon_size: '24px',
    avatar_width: '24px',
    padding: '4px 8px'
  }
}
let accounts_option = [
  {
      list_name: 'account1',
      address: '0x288e86504a82c93c85b208a23ed9ff6f423e966f1c5c87f7b367378bed0430479',
      // text: 'account1',
      // cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAxMUgxMVYzMUgxMi40QzEwLjE1OTggMzEgOS4wMzk2OSAzMSA4LjE4NDA0IDMxLjQzNkM3LjQzMTM5IDMxLjgxOTUgNi44MTk0NyAzMi40MzE0IDYuNDM1OTcgMzMuMTg0QzYgMzQuMDM5NyA2IDM1LjE1OTggNiAzNy40VjM4LjZDNiA0MC44NDAyIDYgNDEuOTYwMyA2LjQzNTk3IDQyLjgxNkM2LjgxOTQ3IDQzLjU2ODYgNy40MzEzOSA0NC4xODA1IDguMTg0MDQgNDQuNTY0QzkuMDM5NjkgNDUgMTAuMTU5OCA0NSAxMi40IDQ1SDE4VjU1LjZDMTggNTcuODQwMiAxOCA1OC45NjAzIDE4LjQzNiA1OS44MTZDMTguODE5NSA2MC41Njg2IDE5LjQzMTQgNjEuMTgwNSAyMC4xODQgNjEuNTY0QzIxLjAzOTcgNjIgMjIuMTU5OCA2MiAyNC40IDYySDQ3LjZDNDkuODQwMiA2MiA1MC45NjAzIDYyIDUxLjgxNiA2MS41NjRDNTIuNTY4NiA2MS4xODA1IDUzLjE4MDUgNjAuNTY4NiA1My41NjQgNTkuODE2QzU0IDU4Ljk2MDMgNTQgNTcuODQwMiA1NCA1NS42VjIwLjRDNTQgMTguMTU5OCA1NCAxNy4wMzk3IDUzLjU2NCAxNi4xODRDNTMuMTgwNSAxNS40MzE0IDUyLjU2ODYgMTQuODE5NSA1MS44MTYgMTQuNDM2QzUwLjk2MDMgMTQgNDkuODQwMiAxNCA0Ny42IDE0SDI0LjRDMjIuMTU5OCAxNCAyMS4wMzk3IDE0IDIwLjE4NCAxNC40MzZDMTkuNDMxNCAxNC44MTk1IDE4LjgxOTUgMTUuNDMxNCAxOC40MzYgMTYuMTg0QzE4IDE3LjAzOTcgMTggMTguMTU5OCAxOCAyMC40VjMxSDEzVjExWk0xMjYgMzQuNEMxMjYgMzIuMTU5OCAxMjYgMzEuMDM5NyAxMjYuNDM2IDMwLjE4NEMxMjYuODE5IDI5LjQzMTQgMTI3LjQzMSAyOC44MTk1IDEyOC4xODQgMjguNDM2QzEyOS4wNCAyOCAxMzAuMTYgMjggMTMyLjQgMjhIMTU1LjZDMTU3Ljg0IDI4IDE1OC45NiAyOCAxNTkuODE2IDI4LjQzNkMxNjAuNTY5IDI4LjgxOTUgMTYxLjE4MSAyOS40MzE0IDE2MS41NjQgMzAuMTg0QzE2MiAzMS4wMzk3IDE2MiAzMi4xNTk4IDE2MiAzNC40VjQ1LjZDMTYyIDQ3Ljg0MDIgMTYyIDQ4Ljk2MDMgMTYxLjU2NCA0OS44MTZDMTYxLjE4MSA1MC41Njg2IDE2MC41NjkgNTEuMTgwNSAxNTkuODE2IDUxLjU2NEMxNTguOTYgNTIgMTU3Ljg0IDUyIDE1NS42IDUySDEzMi40QzEzMC4xNiA1MiAxMjkuMDQgNTIgMTI4LjE4NCA1MS41NjRDMTI3LjQzMSA1MS4xODA1IDEyNi44MTkgNTAuNTY4NiAxMjYuNDM2IDQ5LjgxNkMxMjYgNDguOTYwMyAxMjYgNDcuODQwMiAxMjYgNDUuNlYzNC40WiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJzaWRlc0FudGVubmEwMU1hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSI2IiB5PSIxMSIgd2lkdGg9IjE1NiIgaGVpZ2h0PSI1MSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAxMUgxMVYzMUgxMi40QzEwLjE1OTggMzEgOS4wMzk2OSAzMSA4LjE4NDA0IDMxLjQzNkM3LjQzMTM5IDMxLjgxOTUgNi44MTk0NyAzMi40MzE0IDYuNDM1OTcgMzMuMTg0QzYgMzQuMDM5NyA2IDM1LjE1OTggNiAzNy40VjM4LjZDNiA0MC44NDAyIDYgNDEuOTYwMyA2LjQzNTk3IDQyLjgxNkM2LjgxOTQ3IDQzLjU2ODYgNy40MzEzOSA0NC4xODA1IDguMTg0MDQgNDQuNTY0QzkuMDM5NjkgNDUgMTAuMTU5OCA0NSAxMi40IDQ1SDE4VjU1LjZDMTggNTcuODQwMiAxOCA1OC45NjAzIDE4LjQzNiA1OS44MTZDMTguODE5NSA2MC41Njg2IDE5LjQzMTQgNjEuMTgwNSAyMC4xODQgNjEuNTY0QzIxLjAzOTcgNjIgMjIuMTU5OCA2MiAyNC40IDYySDQ3LjZDNDkuODQwMiA2MiA1MC45NjAzIDYyIDUxLjgxNiA2MS41NjRDNTIuNTY4NiA2MS4xODA1IDUzLjE4MDUgNjAuNTY4NiA1My41NjQgNTkuODE2QzU0IDU4Ljk2MDMgNTQgNTcuODQwMiA1NCA1NS42VjIwLjRDNTQgMTguMTU5OCA1NCAxNy4wMzk3IDUzLjU2NCAxNi4xODRDNTMuMTgwNSAxNS40MzE0IDUyLjU2ODYgMTQuODE5NSA1MS44MTYgMTQuNDM2QzUwLjk2MDMgMTQgNDkuODQwMiAxNCA0Ny42IDE0SDI0LjRDMjIuMTU5OCAxNCAyMS4wMzk3IDE0IDIwLjE4NCAxNC40MzZDMTkuNDMxNCAxNC44MTk1IDE4LjgxOTUgMTUuNDMxNCAxOC40MzYgMTYuMTg0QzE4IDE3LjAzOTcgMTggMTguMTU5OCAxOCAyMC40VjMxSDEzVjExWk0xMjYgMzQuNEMxMjYgMzIuMTU5OCAxMjYgMzEuMDM5NyAxMjYuNDM2IDMwLjE4NEMxMjYuODE5IDI5LjQzMTQgMTI3LjQzMSAyOC44MTk1IDEyOC4xODQgMjguNDM2QzEyOS4wNCAyOCAxMzAuMTYgMjggMTMyLjQgMjhIMTU1LjZDMTU3Ljg0IDI4IDE1OC45NiAyOCAxNTkuODE2IDI4LjQzNkMxNjAuNTY5IDI4LjgxOTUgMTYxLjE4MSAyOS40MzE0IDE2MS41NjQgMzAuMTg0QzE2MiAzMS4wMzk3IDE2MiAzMi4xNTk4IDE2MiAzNC40VjQ1LjZDMTYyIDQ3Ljg0MDIgMTYyIDQ4Ljk2MDMgMTYxLjU2NCA0OS44MTZDMTYxLjE4MSA1MC41Njg2IDE2MC41NjkgNTEuMTgwNSAxNTkuODE2IDUxLjU2NEMxNTguOTYgNTIgMTU3Ljg0IDUyIDE1NS42IDUySDEzMi40QzEzMC4xNiA1MiAxMjkuMDQgNTIgMTI4LjE4NCA1MS41NjRDMTI3LjQzMSA1MS4xODA1IDEyNi44MTkgNTAuNTY4NiAxMjYuNDM2IDQ5LjgxNkMxMjYgNDguOTYwMyAxMjYgNDcuODQwMiAxMjYgNDUuNlYzNC40WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc0FudGVubmEwMU1hc2swKSI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSI3NiIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHk9IjM4IiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjM4IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PHJlY3QgeD0iMTEiIHk9IjExIiB3aWR0aD0iMiIgaGVpZ2h0PSIyMCIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIgZmlsbD0iI0ZGRUE4RiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTMgOUMxNC4xMDQ2IDkgMTUgOC4xMDQ1NyAxNSA3QzE1IDUuODk1NDMgMTQuMTA0NiA1IDEzIDVDMTEuODk1NCA1IDExIDUuODk1NDMgMTEgN0MxMSA4LjEwNDU3IDExLjg5NTQgOSAxMyA5WiIgZmlsbD0id2hpdGUiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDEsIDApIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ4IDBDMzkuMTYzNCAwIDMyIDcuMTYzNDQgMzIgMTZWMzJDMzIgMzYuNDE4MyAzNS41ODE3IDQwIDQwIDQwSDIzQzIyLjQ0NzcgNDAgMjIgNDAuNDQ3NyAyMiA0MVY1MUMyMiA1MS41NTIzIDIyLjQ0NzcgNTIgMjMgNTJINzdDNzcuNTUyMyA1MiA3OCA1MS41NTIzIDc4IDUxVjQxQzc4IDQwLjQ0NzcgNzcuNTUyMyA0MCA3NyA0MEg2MEM2NC40MTgzIDQwIDY4IDM2LjQxODMgNjggMzJWMTZDNjggNy4xNjM0NCA2MC44MzY2IDAgNTIgMEg0OFoiIGZpbGw9IiM1OUM0RkYiLz48bWFzayBpZD0idG9wQnVsYjAxMU1hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSIyMiIgeT0iMCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjUyIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ4IDBDMzkuMTYzNCAwIDMyIDcuMTYzNDQgMzIgMTZWMzJDMzIgMzYuNDE4MyAzNS41ODE3IDQwIDQwIDQwSDIzQzIyLjQ0NzcgNDAgMjIgNDAuNDQ3NyAyMiA0MVY1MUMyMiA1MS41NTIzIDIyLjQ0NzcgNTIgMjMgNTJINzdDNzcuNTUyMyA1MiA3OCA1MS41NTIzIDc4IDUxVjQxQzc4IDQwLjQ0NzcgNzcuNTUyMyA0MCA3NyA0MEg2MEM2NC40MTgzIDQwIDY4IDM2LjQxODMgNjggMzJWMTZDNjggNy4xNjM0NCA2MC44MzY2IDAgNTIgMEg0OFoiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjdG9wQnVsYjAxMU1hc2swKSI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSI1MiIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHg9IjIwIiB5PSItMyIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQzIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjQiLz48cGF0aCBkPSJNNDkgMy41QzUzLjkzMTUgMy41IDU4LjM2NiA1LjYyODE0IDYxLjQzNTIgOS4wMTYxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ5LjgyODQgMjZMNDAuODI4NCAxN0wzOCAxOS44Mjg0TDQ4IDI5LjgyODRWNDBINTJWMjkuOTcwNkw2Mi4xNDIxIDE5LjgyODRMNTkuMzEzNyAxN0w1MC4zMTM3IDI2SDQ5LjgyODRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI1LCA0NCkiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMCAxOEMwIDguMDU4ODggOC4wNTg4OCAwIDE4IDBIMTEyQzEyMS45NDEgMCAxMzAgOC4wNTg4OCAxMzAgMThWNDUuMTQ4M0MxMzAgNDkuNjgzMSAxMjkuMjI5IDU0LjE4NDggMTI3LjcyIDU4LjQ2MTFMMTEwLjIzOSAxMDcuOTkxQzEwNy42OTkgMTE1LjE4NyAxMDAuODk2IDEyMCA5My4yNjQ3IDEyMEgzNi43MzUzQzI5LjEwMzYgMTIwIDIyLjMwMTQgMTE1LjE4NyAxOS43NjE0IDEwNy45OTFMMi4yODAzOCA1OC40NjExQzAuNzcxMTE3IDU0LjE4NDggMCA0OS42ODMxIDAgNDUuMTQ4M0wwIDE4WiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlMDNNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMCAxOEMwIDguMDU4ODggOC4wNTg4OCAwIDE4IDBIMTEyQzEyMS45NDEgMCAxMzAgOC4wNTg4OCAxMzAgMThWNDUuMTQ4M0MxMzAgNDkuNjgzMSAxMjkuMjI5IDU0LjE4NDggMTI3LjcyIDU4LjQ2MTFMMTEwLjIzOSAxMDcuOTkxQzEwNy42OTkgMTE1LjE4NyAxMDAuODk2IDEyMCA5My4yNjQ3IDEyMEgzNi43MzUzQzI5LjEwMzYgMTIwIDIyLjMwMTQgMTE1LjE4NyAxOS43NjE0IDEwNy45OTFMMi4yODAzOCA1OC40NjExQzAuNzcxMTE3IDU0LjE4NDggMCA0OS42ODMxIDAgNDUuMTQ4M0wwIDE4WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNmYWNlU3F1YXJlMDNNYXNrMCkiPjxyZWN0IHg9Ii0yIiB5PSItMiIgd2lkdGg9IjEzNCIgaGVpZ2h0PSIxMjQiIGZpbGw9IiMwMzlCRTUiLz4gdW5kZWZpbmVkIDwvZz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTIsIDEyNCkiPjxyZWN0IHg9IjEyIiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjM2IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjI0IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjQ4IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjYwIiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzOCwgNzYpIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxIDQ1QzI5LjI4NDMgNDUgMzYgMzguMjg0MyAzNiAzMEMzNiAyMS43MTU3IDI5LjI4NDMgMTUgMjEgMTVDMTIuNzE1NyAxNSA2IDIxLjcxNTcgNiAzMEM2IDM4LjI4NDMgMTIuNzE1NyA0NSAyMSA0NVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODMgNDVDOTEuMjg0MyA0NSA5OCAzOC4yODQzIDk4IDMwQzk4IDIxLjcxNTcgOTEuMjg0MyAxNSA4MyAxNUM3NC43MTU3IDE1IDY4IDIxLjcxNTcgNjggMzBDNjggMzguMjg0MyA3NC43MTU3IDQ1IDgzIDQ1WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMSA0MkMyNy42Mjc0IDQyIDMzIDM2LjYyNzQgMzMgMzBDMzMgMjMuMzcyNiAyNy42Mjc0IDE4IDIxIDE4QzE0LjM3MjYgMTggOSAyMy4zNzI2IDkgMzBDOSAzNi42Mjc0IDE0LjM3MjYgNDIgMjEgNDJaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjEiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTgzIDQyQzg5LjYyNzQgNDIgOTUgMzYuNjI3NCA5NSAzMEM5NSAyMy4zNzI2IDg5LjYyNzQgMTggODMgMThDNzYuMzcyNiAxOCA3MSAyMy4zNzI2IDcxIDMwQzcxIDM2LjYyNzQgNzYuMzcyNiA0MiA4MyA0MloiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEgMzZDMjQuMzEzNyAzNiAyNyAzMy4zMTM3IDI3IDMwQzI3IDI2LjY4NjMgMjQuMzEzNyAyNCAyMSAyNEMxNy42ODYzIDI0IDE1IDI2LjY4NjMgMTUgMzBDMTUgMzMuMzEzNyAxNy42ODYzIDM2IDIxIDM2WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04MyAzNkM4Ni4zMTM3IDM2IDg5IDMzLjMxMzcgODkgMzBDODkgMjYuNjg2MyA4Ni4zMTM3IDI0IDgzIDI0Qzc5LjY4NjMgMjQgNzcgMjYuNjg2MyA3NyAzMEM3NyAzMy4zMTM3IDc5LjY4NjMgMzYgODMgMzZaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxIDMzQzIyLjY1NjkgMzMgMjQgMzEuNjU2OSAyNCAzMEMyNCAyOC4zNDMxIDIyLjY1NjkgMjcgMjEgMjdDMTkuMzQzMSAyNyAxOCAyOC4zNDMxIDE4IDMwQzE4IDMxLjY1NjkgMTkuMzQzMSAzMyAyMSAzM1oiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODMgMzNDODQuNjU2OSAzMyA4NiAzMS42NTY5IDg2IDMwQzg2IDI4LjM0MzEgODQuNjU2OSAyNyA4MyAyN0M4MS4zNDMxIDI3IDgwIDI4LjM0MzEgODAgMzBDODAgMzEuNjU2OSA4MS4zNDMxIDMzIDgzIDMzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PC9nPjwvZz48L3N2Zz4=',
      icons: {
          icon: {name: 'datdot-app', path: 'https://avatars.dicebear.com/api/pixel-art-neutral/'},
      },
      current: true,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account2',
      address: '0x33e42b0daad81fb86a9d7e5266a835db618988783a3ab3e5a0f0e7f2010cccdab',
      // text: 'account2',
      // cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNC45ODA5IDIwLjkxNDFDMTQgMjIuODM5MyAxNCAyNS4zNTk1IDE0IDMwLjRWNDUuNkMxNCA1MC42NDA1IDE0IDUzLjE2MDcgMTQuOTgwOSA1NS4wODU5QzE1Ljg0MzggNTYuNzc5NCAxNy4yMjA2IDU4LjE1NjIgMTguOTE0MSA1OS4wMTkxQzIwLjgzOTMgNjAgMjMuMzU5NSA2MCAyOC40IDYwSDM1LjZDNDAuNjQwNSA2MCA0My4xNjA3IDYwIDQ1LjA4NTkgNTkuMDE5MUM0Ni43Nzk0IDU4LjE1NjIgNDguMTU2MiA1Ni43Nzk0IDQ5LjAxOTEgNTUuMDg1OUM1MCA1My4xNjA3IDUwIDUwLjY0MDUgNTAgNDUuNlYzMC40QzUwIDI1LjM1OTUgNTAgMjIuODM5MyA0OS4wMTkxIDIwLjkxNDFDNDguMTU2MiAxOS4yMjA2IDQ2Ljc3OTQgMTcuODQzOCA0NS4wODU5IDE2Ljk4MDlDNDMuMTYwNyAxNiA0MC42NDA1IDE2IDM1LjYgMTZIMjguNEMyMy4zNTk1IDE2IDIwLjgzOTMgMTYgMTguOTE0MSAxNi45ODA5QzE3LjIyMDYgMTcuODQzOCAxNS44NDM4IDE5LjIyMDYgMTQuOTgwOSAyMC45MTQxWk0xMzAuOTgxIDIwLjkxNDFDMTMwIDIyLjgzOTMgMTMwIDI1LjM1OTUgMTMwIDMwLjRWNDUuNkMxMzAgNTAuNjQwNSAxMzAgNTMuMTYwNyAxMzAuOTgxIDU1LjA4NTlDMTMxLjg0NCA1Ni43Nzk0IDEzMy4yMjEgNTguMTU2MiAxMzQuOTE0IDU5LjAxOTFDMTM2LjgzOSA2MCAxMzkuMzYgNjAgMTQ0LjQgNjBIMTUxLjZDMTU2LjY0IDYwIDE1OS4xNjEgNjAgMTYxLjA4NiA1OS4wMTkxQzE2Mi43NzkgNTguMTU2MiAxNjQuMTU2IDU2Ljc3OTQgMTY1LjAxOSA1NS4wODU5QzE2NiA1My4xNjA3IDE2NiA1MC42NDA1IDE2NiA0NS42VjMwLjRDMTY2IDI1LjM1OTUgMTY2IDIyLjgzOTMgMTY1LjAxOSAyMC45MTQxQzE2NC4xNTYgMTkuMjIwNiAxNjIuNzc5IDE3Ljg0MzggMTYxLjA4NiAxNi45ODA5QzE1OS4xNjEgMTYgMTU2LjY0IDE2IDE1MS42IDE2SDE0NC40QzEzOS4zNiAxNiAxMzYuODM5IDE2IDEzNC45MTQgMTYuOTgwOUMxMzMuMjIxIDE3Ljg0MzggMTMxLjg0NCAxOS4yMjA2IDEzMC45ODEgMjAuOTE0MVoiIGZpbGw9IiMwMDc2REUiLz48bWFzayBpZD0ic2lkZXNTcXVhcmVNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMTQiIHk9IjE2IiB3aWR0aD0iMTUyIiBoZWlnaHQ9IjQ0Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE0Ljk4MDkgMjAuOTE0MUMxNCAyMi44MzkzIDE0IDI1LjM1OTUgMTQgMzAuNFY0NS42QzE0IDUwLjY0MDUgMTQgNTMuMTYwNyAxNC45ODA5IDU1LjA4NTlDMTUuODQzOCA1Ni43Nzk0IDE3LjIyMDYgNTguMTU2MiAxOC45MTQxIDU5LjAxOTFDMjAuODM5MyA2MCAyMy4zNTk1IDYwIDI4LjQgNjBIMzUuNkM0MC42NDA1IDYwIDQzLjE2MDcgNjAgNDUuMDg1OSA1OS4wMTkxQzQ2Ljc3OTQgNTguMTU2MiA0OC4xNTYyIDU2Ljc3OTQgNDkuMDE5MSA1NS4wODU5QzUwIDUzLjE2MDcgNTAgNTAuNjQwNSA1MCA0NS42VjMwLjRDNTAgMjUuMzU5NSA1MCAyMi44MzkzIDQ5LjAxOTEgMjAuOTE0MUM0OC4xNTYyIDE5LjIyMDYgNDYuNzc5NCAxNy44NDM4IDQ1LjA4NTkgMTYuOTgwOUM0My4xNjA3IDE2IDQwLjY0MDUgMTYgMzUuNiAxNkgyOC40QzIzLjM1OTUgMTYgMjAuODM5MyAxNiAxOC45MTQxIDE2Ljk4MDlDMTcuMjIwNiAxNy44NDM4IDE1Ljg0MzggMTkuMjIwNiAxNC45ODA5IDIwLjkxNDFaTTEzMC45ODEgMjAuOTE0MUMxMzAgMjIuODM5MyAxMzAgMjUuMzU5NSAxMzAgMzAuNFY0NS42QzEzMCA1MC42NDA1IDEzMCA1My4xNjA3IDEzMC45ODEgNTUuMDg1OUMxMzEuODQ0IDU2Ljc3OTQgMTMzLjIyMSA1OC4xNTYyIDEzNC45MTQgNTkuMDE5MUMxMzYuODM5IDYwIDEzOS4zNiA2MCAxNDQuNCA2MEgxNTEuNkMxNTYuNjQgNjAgMTU5LjE2MSA2MCAxNjEuMDg2IDU5LjAxOTFDMTYyLjc3OSA1OC4xNTYyIDE2NC4xNTYgNTYuNzc5NCAxNjUuMDE5IDU1LjA4NTlDMTY2IDUzLjE2MDcgMTY2IDUwLjY0MDUgMTY2IDQ1LjZWMzAuNEMxNjYgMjUuMzU5NSAxNjYgMjIuODM5MyAxNjUuMDE5IDIwLjkxNDFDMTY0LjE1NiAxOS4yMjA2IDE2Mi43NzkgMTcuODQzOCAxNjEuMDg2IDE2Ljk4MDlDMTU5LjE2MSAxNiAxNTYuNjQgMTYgMTUxLjYgMTZIMTQ0LjRDMTM5LjM2IDE2IDEzNi44MzkgMTYgMTM0LjkxNCAxNi45ODA5QzEzMy4yMjEgMTcuODQzOCAxMzEuODQ0IDE5LjIyMDYgMTMwLjk4MSAyMC45MTQxWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc1NxdWFyZU1hc2swKSI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSI3NiIgZmlsbD0iI0ZGNzA0MyIvPjxyZWN0IHk9IjM4IiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjM4IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQxLCAwKSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01MCAxM0MzOC45NTQzIDEzIDMwIDIxLjk1NDMgMzAgMzNWMzZIMjFDMjAuNDQ3NyAzNiAyMCAzNi40NDc3IDIwIDM3VjUxQzIwIDUxLjU1MjMgMjAuNDQ3NyA1MiAyMSA1Mkg3OUM3OS41NTIzIDUyIDgwIDUxLjU1MjMgODAgNTFWMzdDODAgMzYuNDQ3NyA3OS41NTIzIDM2IDc5IDM2SDcwVjMzQzcwIDIxLjk1NDMgNjEuMDQ1NyAxMyA1MCAxM1oiIGZpbGw9IiM1OUM0RkYiLz48bWFzayBpZD0idG9wQnVsYjAxTWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjIwIiB5PSIxMyIgd2lkdGg9IjYwIiBoZWlnaHQ9IjM5Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDEzQzM4Ljk1NDMgMTMgMzAgMjEuOTU0MyAzMCAzM1YzNkgyMUMyMC40NDc3IDM2IDIwIDM2LjQ0NzcgMjAgMzdWNTFDMjAgNTEuNTUyMyAyMC40NDc3IDUyIDIxIDUySDc5Qzc5LjU1MjMgNTIgODAgNTEuNTUyMyA4MCA1MVYzN0M4MCAzNi40NDc3IDc5LjU1MjMgMzYgNzkgMzZINzBWMzNDNzAgMjEuOTU0MyA2MS4wNDU3IDEzIDUwIDEzWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCN0b3BCdWxiMDFNYXNrMCkiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTIiIGZpbGw9IiNGRjcwNDMiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDM2QzUyLjIwOTEgMzYgNTQgMzUuMDI4IDU0IDMxLjcxNDNDNTQgMjguNDAwNiA1Mi4yMDkxIDI0IDUwIDI0QzQ3Ljc5MDkgMjQgNDYgMjguNDAwNiA0NiAzMS43MTQzQzQ2IDM1LjAyOCA0Ny43OTA5IDM2IDUwIDM2WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC42Ii8+PHJlY3QgeD0iMjAiIHk9IjEzIiB3aWR0aD0iNjAiIGhlaWdodD0iMjMiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNCIvPjxwYXRoIGQ9Ik01MCAxNC41QzQ5LjQ0NzcgMTQuNSA0OSAxNC45NDc3IDQ5IDE1LjVDNDkgMTYuMDUyMyA0OS40NDc3IDE2LjUgNTAgMTYuNVYxNC41Wk02MS42OTQxIDIxLjY4NzVDNjIuMDY0OSAyMi4wOTY4IDYyLjY5NzMgMjIuMTI4MSA2My4xMDY2IDIxLjc1NzNDNjMuNTE1OSAyMS4zODY1IDYzLjU0NzEgMjAuNzU0MSA2My4xNzYzIDIwLjM0NDhMNjEuNjk0MSAyMS42ODc1Wk02NS43NTk1IDI0LjA0NzNDNjUuNTAzNSAyMy41NTc5IDY0Ljg5OTMgMjMuMzY4NiA2NC40MDk5IDIzLjYyNDZDNjMuOTIwNSAyMy44ODA2IDYzLjczMTMgMjQuNDg0OCA2My45ODczIDI0Ljk3NDJMNjUuNzU5NSAyNC4wNDczWk02NS40MjQ4IDI4Ljk1NTlDNjUuNTQwNCAyOS40OTU5IDY2LjA3MTkgMjkuODQgNjYuNjExOSAyOS43MjQ0QzY3LjE1MiAyOS42MDg4IDY3LjQ5NjEgMjkuMDc3MyA2Ny4zODA1IDI4LjUzNzNMNjUuNDI0OCAyOC45NTU5Wk01MCAxNi41QzU0LjYzNzUgMTYuNSA1OC44MDY1IDE4LjQ5OTkgNjEuNjk0MSAyMS42ODc1TDYzLjE3NjMgMjAuMzQ0OEM1OS45MjU2IDE2Ljc1NjMgNTUuMjI1NiAxNC41IDUwIDE0LjVWMTYuNVpNNjMuOTg3MyAyNC45NzQyQzY0LjYzNTcgMjYuMjEzOSA2NS4xMjM5IDI3LjU1MDEgNjUuNDI0OCAyOC45NTU5TDY3LjM4MDUgMjguNTM3M0M2Ny4wNDExIDI2Ljk1MTggNjYuNDkwNCAyNS40NDQ4IDY1Ljc1OTUgMjQuMDQ3M0w2My45ODczIDI0Ljk3NDJaIiBmaWxsPSJ3aGl0ZSIvPjwvZz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjUsIDQ0KSI+PHJlY3Qgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiIHJ4PSIxOCIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlMDFNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiPjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMTIwIiByeD0iMTgiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjZmFjZVNxdWFyZTAxTWFzazApIj48cmVjdCB4PSItMiIgeT0iLTIiIHdpZHRoPSIxMzQiIGhlaWdodD0iMTI0IiBmaWxsPSIjRjQ1MTFFIi8+IHVuZGVmaW5lZCA8L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUyLCAxMjQpIj48cmVjdCB4PSIxMiIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSIzNiIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSIyNCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSI0OCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSI2MCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzgsIDc2KSI+PHJlY3QgeT0iNCIgd2lkdGg9IjEwNCIgaGVpZ2h0PSI0MiIgcng9IjQiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxyZWN0IHg9IjI4IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjExIiByeD0iMiIgZmlsbD0iIzhCRERGRiIvPjxyZWN0IHg9IjY2IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjExIiByeD0iMiIgZmlsbD0iIzhCRERGRiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEgNEgyOUwxMiA0Nkg0TDIxIDRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L2c+PC9nPjwvc3ZnPg==',
      icons: {
          icon: {name: 'robot', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account3',
      address: '0x2f60dd41059136ca6a1d7dcaa86eb350bcd6f7453dc248f2477d80418456762df',
      // text: 'account3',
      // cover: `${path}/developer.svg`,
      icons: {
          icon: {name: 'developer', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account4',
      address: '0x261d34a06b681ae33795b604a1cb712de1c813eb7844bf5129d15328066817c65',
      // text: 'account1',
      // cover: `${path}/ai.svg`,
      icons: {
          icon: {name: 'ai', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account5',
      address: '021a93595b8eefac4d5fa85fc749a244ebc5ee6f3a121c06ecb24d3bca177c38b0',
      // text: 'account2',
      // cover: `${path}/flower.svg`,
      icons: {
          icon: {name: 'flower', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account6',
      address: '0x3e625b740161e0e285c4bb29de128beed64ca742c02b143aa7930e191689c40fb',
      // text: 'account3',
      // cover: `${path}/marine.svg`,
      icons: {
          icon: {name: 'marine', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  }
]

function wallet () {
  const nav_option = [
    {
        name: 'user',
        body: 'USER',
        current: false,
    },
    {
        name: 'plans',
        body: 'PLANS',
        current: true
    },
    {
        name: 'jobs',
        body: 'JOBS',
    },
    {
        name: 'apps',
        body: 'APPS',
        disabled: true,
    }
  ]

  const status = {
    activities: 12345,
    plan: '19v8cMTwMjYvVQgtmZo91gxagp43Pv7XSc'
  }

  function widget () {
    const recipients = []
    const make = message_maker('datdot-wallet')
    const el = make_element({name: 'main', classlist: 'wrap'})
    const shadow = el.attachShadow({mode: 'closed'})
    const container = i_container({name: 'wallet-container'}, protocol('wallet-container'))
    const footer = i_footer({name: 'wallet-footer', body: { nav: nav_option, accounts: accounts_option, status }, to: 'wallet-container'}, protocol('wallet-footer'))
    style_sheet(shadow, style)
    shadow.append(container, footer)

    if (accounts_option.length > 0) handle_account_init(accounts_option)
    
    return el

    function handle_account_init(args) {
      const result = args.filter( obj => obj.current)[0]
      recipients['wallet-footer']( make({type: 'account-changed', data: result}) )
    }

    function handle_change_account({from, data, args}) {
      const arr = [...args]
      arr.map( obj => {
        obj.current = obj.list_name === data.name
        if (obj.current) return recipients[from]( make({type: 'account-changed', data: obj}) )
      })
      return accounts_option = args
    }
    function protocol (name) {
      return send => {
        recipients[name] = send
        return get
      }
    }
    function get (msg) {
      const {head, type, refs, meta, data} = msg
      const from = head[0].split(' / ')[0]
      const to = head[1]
      if (type.match(/ready/)) return 
      if (type.match(/click/)) return
      if (type.match(/switch-page/)) return recipients['wallet-container'](make({type: 'load-page', data}))
      if (type.match(/switch-account/)) return handle_change_account({from, data, args: accounts_option})
      if (type.match(/selected/)) return console.log(from, data)
    }
  }

  let style = `
  :host(.wrap) {
    display: grid;
    ${make_grid({
      rows: '1fr auto',
      areas: ['container', 'nav']
    })}
    height: 100%;
  }
  i-container {
    grid-area: container;
  }
  i-nav {
    grid-area: nav;
  }
  `
  return widget()
}
},{"container":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/container.js","footer":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/footer.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/account-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')
const i_list = require('datdot-ui-list')

module.exports = account_action

function account_action (opt, protocol) {
    const {page = '*', flow = 'account-action', name = '.', body = [], hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action account'})
        const shadow = el.attachShadow({mode: 'closed'})

        // create/import account
        const main_action = make_element({name: 'div', classlist: 'action main'})
        // transfer, edit, delete
        const current_account_action = make_element({name: 'div', classlist: 'action current-account'})
        // switch account
        const accounts_list_action = make_element({name: 'div', classlist: 'action accounts'})

        const button_theme = {
            style: ``,
            props: {
                icon_size: '20px',
                icon_size_hover: '20px',
                border_radius: '0'
            }
        }

        const list_theme = {
            style: ``,
            props: {
                
            }
        }

        const main_option = [
            {name: 'create-account', icon: 'plus', role: 'button', controls: 'wallet-container', theme: button_theme},
            {name: 'import-account', icon: 'import', role: 'button', controls: 'wallet-container', theme: button_theme},
        ]

        const current_account_option = [
            {name: 'account-transfer', icon: 'transfer', role: 'button', controls: 'action-panel', current: false, expanded: false, theme: button_theme},
            {name: 'account-edit', icon: 'edit', role: 'button', controls: 'action-panel',  current: false, expanded: false, theme: button_theme},
            {name: 'account-delete', icon: 'trash', role: 'button', controls: 'action-panel',  current: false, expanded: false, theme: button_theme},
        ]
       
        style_sheet(shadow, style)
        set_attr({aria: 'hidden', prop: is_hidden})
        make_buttons({args: main_option, target: main_action})
        //  actions for current account (transfer, edit, delete)
        if (body.length > 0) make_buttons({args: current_account_option, target: current_account_action})

        // add main acion (create, import)
        shadow.append(main_action)

        if (body.length > 0) {
            const accounts_list = i_list(
                {
                    name: 'account-selector', 
                    body, 
                    mode: 'single-select', 
                    hidden: false,
                    theme: {
                        props: {
                            border_width: '0',
                            border_radius: '0',
                        },
                        grid: {
                            auto: {
                                auto_flow: 'column'
                            }
                        }
                    }
                }, actions_protocol('account-selector'))
            accounts_list_action.append(accounts_list)
            shadow.append(current_account_action, accounts_list_action)
        }

        send( make({type: 'ready'}) )
        return el

        function make_buttons ({args, target}) {
            args.forEach( obj => { 
                const expanded = ('expanded' in obj) ? obj.expanded : void 0
                const current = ('current' in obj) ? obj.current : void 0
                const button = i_button({page, name: obj.name, role: obj.role, icons: {icon: {name: obj.icon}}, expanded, current, controls: obj.controls, theme: obj.theme}, actions_protocol(obj.name))
                target.append(button)
            })
        }

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }

        // handle events
        function handle_account_selected ({from, to = 'wallet-footer'}) {
            return send(make({to, type: 'switch-account', data: {name: from}}))
        }

        function handle_current ({from, to, type, data}) {
            console.log(from, to, type, data)
        }
        // make account action bar to hide
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }
        function actions_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/click/)) return 
            if (type.match(/show|hide/)) return handle_hide(data)
            if (type.match(/current/)) return handle_current({from, to, type, data})
            if (type.match(/selected/)) return handle_account_selected({from, to})
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(0, auto));
        grid-auto-flow: column;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    .accounts {
        width: 100%;
        overflow: scroll hidden;
    }
    .accounts > i-list {
        height: 100%;
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","datdot-ui-list":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-list/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-actions/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = i_actions
function i_actions({page = '*', flow = 'ui-actions', name, body = [], to = '#', status = {}, theme = {}}, protocol) {
    const {activities = 0, plan = undefined} = status
    const recipients = []

    function widget () {
        const make = message_maker(`${name} / ${flow} / ${page}`)
        const send = protocol(get)
        const el = make_element({name: 'i-actions'})
        const shadow = el.attachShadow({mode: 'closed'})
        const list = make_element({name: 'div', classlist: 'list'})
        // for user account, activities
        const main_action = make_element({name: 'div', classlist: 'action main'})
        // for plans list using
        const plans_action = make_element({name: 'div', classlist: 'action plans'})
        // search, sort up/down, filter
        const search_action = make_element({name: 'div', classlist: 'action search'})
        // for each plan using
        const settings_action = make_element({name: 'div', classlist: 'action settings'})
        // for each plan using
        const plan_action = make_element({name: 'div', classlist: 'action'})
        // for activities using
        const activities_event = make_element({name: 'span', classlist: 'badge'})
        const box = make_element({name: 'div', classlist: 'activities'})
        const button_theme = {
            style: `
            :host(i-button) {
                border-bottom: 2px solid hsl(var(--color-white));
            }
            :host(i-button[aria-current="true"]) g, :host(i-button[aria-expanded="true"]) g {
                --icon-fill: var(--color-flame);
            }   
            :host(i-button[aria-expanded="true"]) {
                --bg-color: var(--color-white);
                border-color: hsl(var(--color-black));
            }
            `,
            props: {
                border_radius: '0',
                icon_size: '20px',
                icon_size_hover: '20px',
                icon_fill: 'var(--color-black)',
                icon_fill_hover: 'var(--color-black)',
                bg_color_hover: 'var(--color-greyED)',
                avatar_width: '20px',
                current_icon_size: '20px',
                current_icon_fill: 'var(--color-black)',
                current_bg_color: 'var(--color-greyA2)',
                padding: '8px 10px 4px 10px'
            }
        }
        const switch_theme = {
            style: `
            :host(i-button) {
                border-bottom: 2px solid hsl(var(--color-white));
            }
            :host(i-button[aria-expanded="true"]) {
                background-color: transparent;
                border-bottom: 2px solid hsl(var(--color-black));
            }
            :host(i-button[aria-checked="true"]) {
                --bg-color: transparent;
            }
            :host(i-button[aria-checked="true"]) .icon g {
                --icon-fill: var(--color-black);
            }
            :host(i-button[aria-checked="false"]) .icon g {
                --icon-fill: var(--color-greyA2);
            }
            :host(i-button[aria-current="true"]) {
                --bg-color: var(--color-greyA2);
            }
            `,
            props: {
                border_radius: '0',
                icon_size: '20px',
                icon_size_hover: '20px',
                icon_fill: 'var(--color-greyA2)',
                icon_fill_hover: 'var(--color-black)',
                bg_color_hover: 'var(--color-greyED)',
                current_icon_size: '20px',
                padding: '8px 10px 4px 10px'
            }
        }
        const main_option = [
            {name: 'account', icon: 'account', role: 'button', controls: 'account_action', current: false, expanded: false, theme: button_theme, hide: false},
            {name: 'activity', icon: 'activity', role: 'button', controls: 'wallet-container', current: false, theme: button_theme, hide: false}
        ] 
        const plans_option =  [
            {name: 'planlist', icon: 'plan-list',  role: 'switch', controls: 'wallet-container', current: false, expanded: true, checked: true, theme: switch_theme},
            {name: 'performance', icon: 'map',  role: 'switch', controls: 'wallet-container', current: false, expanded: true, checked: true, theme: switch_theme},
            {name: 'linechart', icon: 'linechart', role: 'switch', controls: 'wallet-container', current: false, expanded: true, checked: true, theme: switch_theme},
        ]
        const search_option = [
            {name: 'search', icon: 'search',  role: 'button', controls: 'search_action', current: false, expanded: false, theme: button_theme},
            {name: 'sort-up', icon: 'sort-up',  role: 'switch', controls: 'sortup_action', current: false, expanded: false, checked: false, theme: switch_theme},
            {name: 'sort-down', icon: 'sort-down',  role: 'switch', controls: 'sortdown_action', current: false, expanded: false, checked: true, theme: switch_theme},
            {name: 'filter', icon: 'filter',  role: 'button', controls: 'filter_action', current: false, expanded: false, theme: button_theme},
        ]
            
        const plan_option = [
            {name: 'plan-play', icon: 'play',  role: 'switch', controls: 'play', current: false, checked: true, theme: switch_theme},
            {name: 'plan-pause', icon: 'pause',  role: 'switch', controls: 'pause', current: false, checked: false, theme: switch_theme},
            {name: 'plan-edit', icon: 'edit',  role: 'button', controls: 'edit', current: false, theme: button_theme},
            {name: 'plan-delete', icon: 'trash',  role: 'button', controls: 'delected', current: false, theme: button_theme}
        ]
        
        const settings_option = [
            {name: 'create-plan', icon: 'plus',  role: 'button', controls: 'wallet-container', current: false, theme: button_theme},
            {name: 'custom-action', icon: 'action',  role: 'button', controls: 'custom_action', current: false, expanded: false, theme: button_theme},
            {name: 'help-mode', icon: 'help',  role: 'button', controls: 'help_action', current: false, expanded: false,theme: button_theme}
        ]
        
        make_buttons({args: main_option, target: main_action})
        make_buttons({args: settings_option, target: settings_action})
        make_buttons({args: plans_option, target: plans_action})
        make_buttons({args: search_option, target: search_action})
        // only display when click plan
        
        // console.log(first_action, second_action)
        // !important style_sheet must be implemented before shadow 
        // For Safari and Firefox cannot implement shadow before style
        style_sheet(shadow, style)
        shadow.append(main_action)
        // list add plans action
        if (plans_action) list.append(plans_action)
        // list add search action
        if (search_action) list.append(search_action)
        // list add plan action if there is a plan selected
        if (plan) {
            make_buttons ({args: plan_option, target: plan_action})
            list.append(plan_action)
        } 
        shadow.append(list)
        shadow.append(settings_action)

        document.addEventListener('DOMContentLoaded', () => {
            // if there is any activites would be dispalying
            if (activities > 0) {
                box.append(activities_event)
                activities_event.textContent = activities
                // make activities_event align center for responsive size
                activities_event.style.marginLeft = `-${activities_event.clientWidth / 2}px`
            }
        })

        send(make({type: 'ready'}))
        return el
      
        function make_buttons ({args, target}) {
            args.forEach( obj => {
                if (obj.hide) return
                const checked = ('checked' in obj) ?  obj.checked : void 0
                const expanded = ('expanded' in obj) ? obj.expanded : void 0
                const current = ('current' in obj) ? obj.current : void 0
                const button = i_button({page, name: obj.name, role: obj.role, icons: {icon: {name: obj.icon}}, checked, expanded, current, controls: obj.controls, theme: obj.theme}, actions_protocol(obj.name))
                if (obj.name === 'activity') {
                    const button = i_button({page, name: obj.name, role: obj.role, icons: {icon: {name: obj.icon}}, checked, expanded, current, controls: obj.controls, theme: obj.theme}, actions_protocol(obj.name))
                    box.append(button)
                    return target.append(box)
                }
                target.append(button)
            })
        }

        // event handler
        function handle_account_changed (data) {
            const {list_name, address, cover = undefined, icons = undefined, controls} = data
            const name = controls.match(/account/)[0]
            const icon = icons ? icons.icon || icons.list : undefined
            const content =  {cover, icon, title: `${list_name}`}
            recipients[name](make({type: 'changed', data: content}))
        }
        function handle_switch ({from, to, data}) {
            const {name, checked} = data
            const make = message_maker(`${name} / ${flow} / ${page}`)
            // for sort-up and sort-down
            if (from.match(/sort/))  {
                if (checked) return
                const filter_results = Object.keys(recipients).filter( key => key.match(/sort/) )
                filter_results.forEach( result => {
                    if (result === from) return recipients[from]( make({type: 'switched', data: {checked: !checked}}) )
                    recipients[result]( make({type: 'switched', data: {checked}}) )
                })
                return
            }
            // for plan-play and plan-pasue
            if (from.match(/plan-/)) {
                if (checked) return
                const filter_results = Object.keys(recipients).filter( key => key.match(/plan-play|plan-pause/) )
                filter_results.forEach( result => {
                    if (result === from) return recipients[from]( make({type: 'switched', data: {checked: !checked}}) )
                    recipients[result]( make({type: 'switched', data: {checked}}) )
                })
                return
            }
            // toggle planlist or performance or linechart to show/hide
            if (from.match(/planlist|performance|linechart/)) {
                const message = {to, type: 'panel-hide', data: {name, hide: checked}}
                send(make(message))
                recipients[from]( make({type: 'switched', data: {checked: !checked}}) )
                return
            }
        }
        function handle_expanded (from, to, {expanded}) {
            const make = message_maker(`${from} / ${flow} / ${page}`)
            Object.keys(recipients).forEach( key => {
                // to expand 
                if (key === from) {
                    const message = {type: 'expanded', data: !expanded}
                    recipients[from](make(message))
                    return send(make({type: 'expanded', data: {expanded: !expanded}}))
                }
                // to prevent planlist, performance and linechart to collapse sub-actions
                if (key.match(/account|search|sort|filter|custom|help/) && from.match(/account|search|sort|filter|custom|help/)) {
                    return handle_collapsed(key, to, {expanded: !expanded})
                }
            }) 
        }
        function handle_collapsed (from, to, {expanded}) {
            const make = message_maker(`${from} / ${flow} / ${page}`)
            const message = {type: 'collapsed', data: !expanded}
            recipients[from](make(message))
            return send(make({from, ...message}))
        }
        function handle_current ({name, current}) {
            if (current) return
            const make = message_maker(`${name} / ${flow} / ${page}`)
            Object.keys(recipients).forEach(key => {
                if (key === name) return recipients[name](make({type: 'current', data: !current}))
                return recipients[key](make({type: 'current', data: current}))
            }) 
        }
        function handle_click (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const role = head[0].split(' / ')[1]
            const make = message_maker(`${from} / ${flow} / ${page}`)
            const to = head[1]
            send(make(msg))
            if (role === 'switch') return handle_switch({from, to, data})
        }
        function actions_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            const make = message_maker(`${from} / ${flow} / ${page}`)
            if (type.match(/ready/)) return send(make(msg))
            if (type.match(/click/)) return handle_click(msg)
            if (type.match(/expanded/)) return handle_expanded(from, to, data)
            if (type.match(/collapsed/)) return handle_collapsed(from, to, data)
            if (type.match(/current/)) return handle_current(data)
            if (type.match(/account-changed/)) return handle_account_changed(data)
        }
    }

    const style = `
    :host(i-actions) {
        --bg-color: var(--color-white);
        display: grid;
        ${make_grid({
            columns: 'auto 1fr auto',
            auto: {
                auto_flow: 'column'
            }
        })}
        background-color: hsl(var(--bg-color));
        border-top: 1px solid hsl(var(--color-black));
    }
    .list {
        display: flex;
        overflow: scroll hidden;
    }
    .action {
        display: grid;
        /* auto fill all buttons */
        ${make_grid({
            columns: 'repeat(auto-fill, minmax(1fr, auto))',
            auto: {
                auto_flow: 'column'
            }
        })}
        gap: 2px;
    }
    :host(i-actions) > .action::after, .list > .action:after {
        display: block;
        content: '';
        border-right: 1px solid hsl(var(--color-greyC3));
        height: 60%;
        align-self: center;
    }
    :host(i-actions) > .action:last-child:before {
        display: block;
        content: '';
        border-right: 1px solid hsl(var(--color-greyC3));
        height: 60%;
        align-self: center;
    }
    :host(i-actions) > .action:last-child:after {
        border-right: none;
    }
    .activities {
        position: relative;
    }
    i-button[aria-label="activity"] {
        ${make_grid({
            row: '1',
            column: '2'
        })}
    }
    .badge {
        --color: var(--color-white);
        --size: var(--size12);
        --bg-color: var(--color-black);
        --opacity: 0.6;
        ${make_grid({
            row: '1',
            column: '2'
        })}
        position: absolute;
        transform: scale(0.8);
        bottom: -2px;
        left: 50%;
        z-index: 1;
        font-size: var(--size);
        color: hsl(var(--color));
        text-align: center;
        background-color: hsla(var(--bg-color), var(--opacity));
        padding: 4px 6px;
        border-radius: var(--primary-radius);
    }
    .settings {
        grid-column-end: -1;
    }
    `
    return widget()
}

},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-bubble-map/src/index.js":[function(require,module,exports){
const style_sheet = require('../../../support-style-sheet')
const message_maker = require('../../../message-maker')
const make_grid = require('../../../make-grid')
const make_element = require('../../../make-element')
const {i_button} = require('datdot-ui-button')
const L = require('leaflet')
const markerClusterGroup = require('Leaflet.markercluster')
const leaflet_css = require('./node_modules/leaflet.css')
const marker_cluster_css = require('./node_modules/marker-cluster.default.css.js')

module.exports = bubble_map

function bubble_map (opt, protocol) {
    const {page = '*', flow = 'ui-bubble-map', name = '.', body = undefined, hide = false, to = '#' } = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'map'})
        const shadow = el.attachShadow({mode: 'closed'})
        const mapid = make_element({name: 'div'})
        mapid.setAttribute('id', 'mapid')
        shadow.append(mapid)

        style_sheet(shadow, style)

        const addressPoints = [
            [-37.8210922667, 175.2209316333, "2"],
            [-37.8210819833, 175.2213903167, "3"],
            [-37.8210881833, 175.2215004833, "34"],
            [-37.8211946833, 175.2213655333, "1"],
            [-37.8209458667, 175.2214051333, "5"],
            [-37.8208292333, 175.2214374833, "7"],
            [-37.8325816, 175.2238798667, "537"],
            [-37.8315855167, 175.2279767, "454"],
            [-37.8096336833, 175.2223743833, "176"],
            [-37.80970685, 175.2221815833, "178"],
            [-37.8102146667, 175.2211562833, "190"],
            [-37.8088037167, 175.2242227, "156"],
            [-37.8112330167, 175.2193425667, "210"],
            [-37.8116368667, 175.2193005167, "212"],
            [-37.80812645, 175.2255449333, "146"],
            [-37.8080231333, 175.2286383167, "125"],
            [-37.8089538667, 175.2222222333, "174"],
            [-37.8080905833, 175.2275400667, "129"]
          ]

        // L.map(<HTMLElement> el or #id).setView([x,y], zoom)
        const map = L.map(mapid, {
            center: [-37.82, 175.23],
            zoom: 12,
            // default is true to support scrollWheelZoom
            scrollWheelZoom: false,
            // default is true to support double click on map to zoom in
            doubleClickZoom: false,
            // use Shift + mouse left to draw a rectangle area and go to see area
            boxZoom: true,
            keyboardPanOffset: 80,
            // default 1 to zoom map
            keyboardZoomOffset: 1,
        })
        // longitude(Y), latitude(X)
        // .setView([-37.82, 175.23], 12)

        // copyright for leaflet.js and OpenStreetMap must be shown on the page
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        // --- start --- custom icon
        L.Icon.Default.imagePath = "src/assets"
        const LeafIcon = L.Icon.extend({
            options: {
            shadowUrl: `${L.Icon.Default.imagePath}/flag-shadow.svg`,
               iconSize:     [25, 32],
               shadowSize:   [25, 32],
               iconAnchor:   [22, 94],
               shadowAnchor: [22, 94],
               popupAnchor:  [-10, -100]
            }
        })

        const maker_icon = new LeafIcon({
            iconUrl: `${L.Icon.Default.imagePath}/flag.svg`,
        })

        // L.marker([51.5, -0.09], {icon: maker_icon }).addTo(map)
        // .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        // .openPopup()
        //  --- end --- custom icon

        const markers = L.markerClusterGroup()
        addressPoints.forEach( point => {
            const a = point
            const [x, y, title] = a
            const marker = L.marker(new L.LatLng(x, y), {icon: maker_icon }, {title})
            marker.bindPopup(title)
            markers.addLayer(marker)
        })

        map.addLayer(markers)

        // set popup on map
        // map.on('click', onMapClick)
        // const popup = L.popup()
        // function onMapClick (e) {
        //     popup
        //     .setLatLng(e.latlng)
        //     .setContent("You clicked the map at " + e.latlng.toString())
        //     .openOn(map);
        // }
     

        // dont put here, it is not worked.
        // map.invalidateSize();

        // invalidateSize() only worked when DOMContentLoaded to accurate for correct map size
        document.addEventListener('DOMContentLoaded', () => {
            map.invalidateSize();
        })
        
        
        return el

        function get (msg) {

        }

    }

    const style = `
    :host(.map) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        height: 100%;
    }
    :host(.map[aria-hidden="true"]) {
        display: none;
    }
    :host(.map[aria-hidden="false"]) {
    }
    #mapid {
        width: 100%;
        height: 100%;
    }
    ${leaflet_css}
    ${marker_cluster_css}
    `

    return widget()
}
},{"../../../make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","../../../make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","../../../message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","../../../support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js","./node_modules/leaflet.css":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-bubble-map/src/node_modules/leaflet.css.js","./node_modules/marker-cluster.default.css.js":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-bubble-map/src/node_modules/marker-cluster.default.css.js","Leaflet.markercluster":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/Leaflet.markercluster/dist/leaflet.markercluster-src.js","datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","leaflet":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/leaflet/dist/leaflet-src.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-bubble-map/src/node_modules/leaflet.css.js":[function(require,module,exports){
module.exports = `
/* required styles */
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
	position: absolute;
	left: 0;
	top: 0;
}
.leaflet-container {
	overflow: hidden;
}
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
	-webkit-user-select: none;
	   -moz-user-select: none;
	        user-select: none;
	  -webkit-user-drag: none;
}
/* Prevents IE11 from highlighting tiles in blue */
.leaflet-tile::selection {
	background: transparent;
}
/* Safari renders non-retina tile on retina better with this, but Chrome is worse */
.leaflet-safari .leaflet-tile {
	image-rendering: -webkit-optimize-contrast;
}
/* hack that prevents hw layers "stretching" when loading new tiles */
.leaflet-safari .leaflet-tile-container {
	width: 1600px;
	height: 1600px;
	-webkit-transform-origin: 0 0;
}
.leaflet-marker-icon,
.leaflet-marker-shadow {
	display: block;
}
/* .leaflet-container svg: reset svg max-width decleration shipped in Joomla! (joomla.org) 3.x */
/* .leaflet-container img: map is broken in FF if you have max-width: 100% on tiles */
.leaflet-container .leaflet-overlay-pane svg,
.leaflet-container .leaflet-marker-pane img,
.leaflet-container .leaflet-shadow-pane img,
.leaflet-container .leaflet-tile-pane img,
.leaflet-container img.leaflet-image-layer,
.leaflet-container .leaflet-tile {
	max-width: none !important;
	max-height: none !important;
}
.leaflet-container.leaflet-touch-zoom {
	-ms-touch-action: pan-x pan-y;
	touch-action: pan-x pan-y;
}
.leaflet-container.leaflet-touch-drag {
	-ms-touch-action: pinch-zoom;
	/* Fallback for FF which doesn't support pinch-zoom */
	touch-action: none;
	touch-action: pinch-zoom;
}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom {
	-ms-touch-action: none;
	touch-action: none;
}
.leaflet-container {
	-webkit-tap-highlight-color: transparent;
}
.leaflet-container a {
	-webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
}
.leaflet-tile {
	filter: inherit;
	visibility: hidden;
}
.leaflet-tile-loaded {
	visibility: inherit;
}
.leaflet-zoom-box {
	width: 0;
	height: 0;
	-moz-box-sizing: border-box;
	     box-sizing: border-box;
	z-index: 800;
}
/* workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=888319 */
.leaflet-overlay-pane svg {
	-moz-user-select: none;
}
.leaflet-pane         { z-index: 400; }
.leaflet-tile-pane    { z-index: 200; }
.leaflet-overlay-pane { z-index: 400; }
.leaflet-shadow-pane  { z-index: 500; }
.leaflet-marker-pane  { z-index: 600; }
.leaflet-tooltip-pane   { z-index: 650; }
.leaflet-popup-pane   { z-index: 700; }
.leaflet-map-pane canvas { z-index: 100; }
.leaflet-map-pane svg    { z-index: 200; }
.leaflet-vml-shape {
	width: 1px;
	height: 1px;
}
.lvml {
	behavior: url(#default#VML);
	display: inline-block;
	position: absolute;
}
/* control positioning */
.leaflet-control {
	position: relative;
	z-index: 800;
	pointer-events: visiblePainted; /* IE 9-10 doesn't have auto */
	pointer-events: auto;
}
.leaflet-top,
.leaflet-bottom {
	position: absolute;
	z-index: 1000;
	pointer-events: none;
}
.leaflet-top {
	top: 0;
}
.leaflet-right {
	right: 0;
}
.leaflet-bottom {
	bottom: 0;
}
.leaflet-left {
	left: 0;
}
.leaflet-control {
	float: left;
	clear: both;
}
.leaflet-right .leaflet-control {
	float: right;
}
.leaflet-top .leaflet-control {
	margin-top: 10px;
}
.leaflet-bottom .leaflet-control {
	margin-bottom: 10px;
}
.leaflet-left .leaflet-control {
	margin-left: 10px;
}
.leaflet-right .leaflet-control {
	margin-right: 10px;
}
/* zoom and fade animations */
.leaflet-fade-anim .leaflet-tile {
	will-change: opacity;
}
.leaflet-fade-anim .leaflet-popup {
	opacity: 0;
	-webkit-transition: opacity 0.2s linear;
	   -moz-transition: opacity 0.2s linear;
	        transition: opacity 0.2s linear;
}
.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {
	opacity: 1;
}
.leaflet-zoom-animated {
	-webkit-transform-origin: 0 0;
	    -ms-transform-origin: 0 0;
	        transform-origin: 0 0;
}
.leaflet-zoom-anim .leaflet-zoom-animated {
	will-change: transform;
}
.leaflet-zoom-anim .leaflet-zoom-animated {
	-webkit-transition: -webkit-transform 0.25s cubic-bezier(0,0,0.25,1);
	   -moz-transition:    -moz-transform 0.25s cubic-bezier(0,0,0.25,1);
	        transition:         transform 0.25s cubic-bezier(0,0,0.25,1);
}
.leaflet-zoom-anim .leaflet-tile,
.leaflet-pan-anim .leaflet-tile {
	-webkit-transition: none;
	   -moz-transition: none;
	        transition: none;
}
.leaflet-zoom-anim .leaflet-zoom-hide {
	visibility: hidden;
}
/* cursors */
.leaflet-interactive {
	cursor: pointer;
}
.leaflet-grab {
	cursor: -webkit-grab;
	cursor:    -moz-grab;
	cursor:         grab;
}
.leaflet-crosshair,
.leaflet-crosshair .leaflet-interactive {
	cursor: crosshair;
}
.leaflet-popup-pane,
.leaflet-control {
	cursor: auto;
}
.leaflet-dragging .leaflet-grab,
.leaflet-dragging .leaflet-grab .leaflet-interactive,
.leaflet-dragging .leaflet-marker-draggable {
	cursor: move;
	cursor: -webkit-grabbing;
	cursor:    -moz-grabbing;
	cursor:         grabbing;
}
/* marker & overlays interactivity */
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-image-layer,
.leaflet-pane > svg path,
.leaflet-tile-container {
	pointer-events: none;
}
.leaflet-marker-icon.leaflet-interactive,
.leaflet-image-layer.leaflet-interactive,
.leaflet-pane > svg path.leaflet-interactive,
svg.leaflet-image-layer.leaflet-interactive path {
	pointer-events: visiblePainted; /* IE 9-10 doesn't have auto */
	pointer-events: auto;
}
/* visual tweaks */
.leaflet-container {
	background: #ddd;
	outline: 0;
}
.leaflet-container a {
	color: #0078A8;
}
.leaflet-container a.leaflet-active {
	outline: 2px solid orange;
}
.leaflet-zoom-box {
	border: 2px dotted #38f;
	background: rgba(255,255,255,0.5);
}
/* general typography */
.leaflet-container {
	font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;
}
/* general toolbar styles */
.leaflet-bar {
	box-shadow: 0 1px 5px rgba(0,0,0,0.65);
	border-radius: 4px;
}
.leaflet-bar a,
.leaflet-bar a:hover {
	background-color: #fff;
	border-bottom: 1px solid #ccc;
	width: 26px;
	height: 26px;
	line-height: 26px;
	display: block;
	text-align: center;
	text-decoration: none;
	color: black;
}
.leaflet-bar a,
.leaflet-control-layers-toggle {
	background-position: 50% 50%;
	background-repeat: no-repeat;
	display: block;
}
.leaflet-bar a:hover {
	background-color: #f4f4f4;
}
.leaflet-bar a:first-child {
	border-top-left-radius: 4px;
	border-top-right-radius: 4px;
}
.leaflet-bar a:last-child {
	border-bottom-left-radius: 4px;
	border-bottom-right-radius: 4px;
	border-bottom: none;
}
.leaflet-bar a.leaflet-disabled {
	cursor: default;
	background-color: #f4f4f4;
	color: #bbb;
}
.leaflet-touch .leaflet-bar a {
	width: 30px;
	height: 30px;
	line-height: 30px;
}
.leaflet-touch .leaflet-bar a:first-child {
	border-top-left-radius: 2px;
	border-top-right-radius: 2px;
}
.leaflet-touch .leaflet-bar a:last-child {
	border-bottom-left-radius: 2px;
	border-bottom-right-radius: 2px;
}
/* zoom control */
.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
	font: bold 18px 'Lucida Console', Monaco, monospace;
	text-indent: 1px;
}
.leaflet-touch .leaflet-control-zoom-in, .leaflet-touch .leaflet-control-zoom-out  {
	font-size: 22px;
}
/* layers control */
.leaflet-control-layers {
	box-shadow: 0 1px 5px rgba(0,0,0,0.4);
	background: #fff;
	border-radius: 5px;
 }
.leaflet-control-layers-toggle {
	background-image: url(images/layers.png);
	width: 36px;
	height: 36px;
}
.leaflet-retina .leaflet-control-layers-toggle {
	background-image: url(images/layers-2x.png);
	background-size: 26px 26px;
}
.leaflet-touch .leaflet-control-layers-toggle {
	width: 44px;
	height: 44px;
}
.leaflet-control-layers .leaflet-control-layers-list,
.leaflet-control-layers-expanded .leaflet-control-layers-toggle {
	display: none;
}
.leaflet-control-layers-expanded .leaflet-control-layers-list {
	display: block;
	position: relative;
}
.leaflet-control-layers-expanded {
	padding: 6px 10px 6px 6px;
	color: #333;
	background: #fff;
}
.leaflet-control-layers-scrollbar {
	overflow-y: scroll;
	overflow-x: hidden;
	padding-right: 5px;
}
.leaflet-control-layers-selector {
	margin-top: 2px;
	position: relative;
	top: 1px;
}
.leaflet-control-layers label {
	display: block;
}
.leaflet-control-layers-separator {
	height: 0;
	border-top: 1px solid #ddd;
	margin: 5px -10px 5px -6px;
}
/* Default icon URLs */
.leaflet-default-icon-path {
	background-image: url(src/assets/marker-icon.png);
	}
/* attribution and scale controls */
.leaflet-container .leaflet-control-attribution {
	background: #fff;
	background: rgba(255, 255, 255, 0.7);
	margin: 0;
}
.leaflet-control-attribution,
.leaflet-control-scale-line {
	padding: 0 5px;
	color: #333;
}
.leaflet-control-attribution a {
	text-decoration: none;
}
.leaflet-control-attribution a:hover {
	text-decoration: underline;
}
.leaflet-container .leaflet-control-attribution,
.leaflet-container .leaflet-control-scale {
	font-size: 11px;
}
.leaflet-left .leaflet-control-scale {
	margin-left: 5px;
}
.leaflet-bottom .leaflet-control-scale {
	margin-bottom: 5px;
}
.leaflet-control-scale-line {
	border: 2px solid #777;
	border-top: none;
	line-height: 1.1;
	padding: 2px 5px 1px;
	font-size: 11px;
	white-space: nowrap;
	overflow: hidden;
	-moz-box-sizing: border-box;
	     box-sizing: border-box;
	background: #fff;
	background: rgba(255, 255, 255, 0.5);
}
.leaflet-control-scale-line:not(:first-child) {
	border-top: 2px solid #777;
	border-bottom: none;
	margin-top: -2px;
}
.leaflet-control-scale-line:not(:first-child):not(:last-child) {
	border-bottom: 2px solid #777;
}
.leaflet-touch .leaflet-control-attribution,
.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
	box-shadow: none;
}
.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
	border: 2px solid rgba(0,0,0,0.2);
	background-clip: padding-box;
}
/* popup */
.leaflet-popup {
	position: absolute;
	text-align: center;
	margin-bottom: 20px;
}
.leaflet-popup-content-wrapper {
	padding: 1px;
	text-align: left;
	border-radius: 12px;
}
.leaflet-popup-content {
	margin: 13px 19px;
	line-height: 1.4;
}
.leaflet-popup-content p {
	margin: 18px 0;
}
.leaflet-popup-tip-container {
	width: 40px;
	height: 20px;
	position: absolute;
	left: 50%;
	margin-left: -20px;
	overflow: hidden;
	pointer-events: none;
}
.leaflet-popup-tip {
	width: 17px;
	height: 17px;
	padding: 1px;

	margin: -10px auto 0;

	-webkit-transform: rotate(45deg);
	   -moz-transform: rotate(45deg);
	    -ms-transform: rotate(45deg);
	        transform: rotate(45deg);
}
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
	background: white;
	color: #333;
	box-shadow: 0 3px 14px rgba(0,0,0,0.4);
}
.leaflet-container a.leaflet-popup-close-button {
	position: absolute;
	top: 0;
	right: 0;
	padding: 4px 4px 0 0;
	border: none;
	text-align: center;
	width: 18px;
	height: 14px;
	font: 16px/14px Tahoma, Verdana, sans-serif;
	color: #c3c3c3;
	text-decoration: none;
	font-weight: bold;
	background: transparent;
}
.leaflet-container a.leaflet-popup-close-button:hover {
	color: #999;
}
.leaflet-popup-scrolled {
	overflow: auto;
	border-bottom: 1px solid #ddd;
	border-top: 1px solid #ddd;
}
.leaflet-oldie .leaflet-popup-content-wrapper {
	-ms-zoom: 1;
}
.leaflet-oldie .leaflet-popup-tip {
	width: 24px;
	margin: 0 auto;
	-ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";
	filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);
}
.leaflet-oldie .leaflet-popup-tip-container {
	margin-top: -1px;
}
.leaflet-oldie .leaflet-control-zoom,
.leaflet-oldie .leaflet-control-layers,
.leaflet-oldie .leaflet-popup-content-wrapper,
.leaflet-oldie .leaflet-popup-tip {
	border: 1px solid #999;
}
/* div icon */
.leaflet-div-icon {
	background: #fff;
	border: 1px solid #666;
}
/* Tooltip */
/* Base styles for the element that has a tooltip */
.leaflet-tooltip {
	position: absolute;
	padding: 6px;
	background-color: #fff;
	border: 1px solid #fff;
	border-radius: 3px;
	color: #222;
	white-space: nowrap;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	pointer-events: none;
	box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.leaflet-tooltip.leaflet-clickable {
	cursor: pointer;
	pointer-events: auto;
}
.leaflet-tooltip-top:before,
.leaflet-tooltip-bottom:before,
.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {
	position: absolute;
	pointer-events: none;
	border: 6px solid transparent;
	background: transparent;
	content: "";
}

/* Directions */
.leaflet-tooltip-bottom {
	margin-top: 6px;
}
.leaflet-tooltip-top {
	margin-top: -6px;
}
.leaflet-tooltip-bottom:before,
.leaflet-tooltip-top:before {
	left: 50%;
	margin-left: -6px;
}
.leaflet-tooltip-top:before {
	bottom: 0;
	margin-bottom: -12px;
	border-top-color: #fff;
}
.leaflet-tooltip-bottom:before {
	top: 0;
	margin-top: -12px;
	margin-left: -6px;
	border-bottom-color: #fff;
	}
.leaflet-tooltip-left {
	margin-left: -6px;
}
.leaflet-tooltip-right {
	margin-left: 6px;
}
.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {
	top: 50%;
	margin-top: -6px;
}
.leaflet-tooltip-left:before {
	right: 0;
	margin-right: -12px;
	border-left-color: #fff;
}
.leaflet-tooltip-right:before {
	left: 0;
	margin-left: -12px;
	border-right-color: #fff;
}
`
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-bubble-map/src/node_modules/marker-cluster.default.css.js":[function(require,module,exports){
module.exports = `
.marker-cluster-small {
	background-color: hsla(var(--color-black), 0.2);
}
.marker-cluster-small div {
	background-color: hsl(var(--color-black), 0.69);
}
.marker-cluster-medium {
	background-color: hsla(var(--color-black), 0.2);
}
.marker-cluster-medium div {
	background-color: hsla(var(--color-black), 0.69);
}
.marker-cluster-large {
	background-color: hsla(var(--color-black), 0.2);
}
.marker-cluster-large div {
	background-color: hsla(var(--color-black), 0.69);
}
/* IE 6-8 fallback colors */
.leaflet-oldie .marker-cluster-small {
	background-color: rgb(181, 226, 140);
}
.leaflet-oldie .marker-cluster-small div {
	background-color: rgb(110, 204, 57);
}
.leaflet-oldie .marker-cluster-medium {
	background-color: rgb(241, 211, 87);
}
.leaflet-oldie .marker-cluster-medium div {
	background-color: rgb(240, 194, 12);
}
.leaflet-oldie .marker-cluster-large {
	background-color: rgb(253, 156, 115);
}
.leaflet-oldie .marker-cluster-large div {
	background-color: rgb(241, 128, 23);
}
.marker-cluster {
	background-clip: padding-box;
	border-radius: 20px;
}
.marker-cluster div {
	width: 30px;
	height: 30px;
	margin-left: 5px;
	margin-top: 5px;
	text-align: center;
	border-radius: 15px;
	font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
}
.marker-cluster span {
	color: hsl(var(--color-white));
    line-height: 30px;
}
`
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-navigation/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const {i_button} = require('datdot-ui-button')

module.exports = navigation

function navigation ({page = '*', flow = 'ui-navigation', to = '#', name = '.', body = [], theme = {}}, protocol) {
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    
    function widget () {
        const role = 'tab'
        const send = protocol(get)
        const el = document.createElement('nav')
        const shadow = el.attachShadow({mode: 'open'})
        const tab_theme = {
            style: `
                i-button[disabled]:hover {
                    border-color: 
                }
            `,
            props: {
                border_width: '1px',
                border_color_hover: 'var(--color-black)'
            }
        }
        el.setAttribute('aria-label', name)
        el.setAttribute('role', 'tablist')
        // !important style_sheet must be implemented before shadow 
        // For Safari and Firefox cannot implement shadow before style
        style_sheet(shadow, style)
        body.forEach( opt => {
            const tab = i_button({page, flow, role, name: opt.name.toLowerCase(), body: opt.body, current: opt.current, disabled: opt.disabled, controls: to, theme: tab_theme}, btn_protocol(opt.name.toLowerCase()))
            shadow.append(tab)
        })
        return el

        function handle_current (to, data) {
            const {name, current} = data
            if (current) return            
            Object.entries(recipients).forEach(([key, value]) => {
                if (key === name) {
                    recipients[name](make({type: 'tab-selected', data: {selected: !current}}))
                    send( make({to, type: 'tab-selected', data: {name}}) )
                    return recipients[name](make({type: 'current', data: !current}))
                }
                recipients[key](make({type: 'tab-selected', data: {selected: current}}))
                return recipients[key](make({type: 'current', data: current}))
            }) 
        }
        function btn_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/ready/)) return send(make(msg))
            if (type.match(/current/)) return handle_current(to, data)
        }
    }

    const style = `
    :host(nav) {
        display: grid;
        ${make_grid({
            auto: {
                auto_flow: 'column'
            }
        })}
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/container.js":[function(require,module,exports){
const bel = require('bel')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const bubble_map = require('components/datdot-ui-bubble-map/src')

module.exports = i_container
function i_container({page = '*', flow = 'ui-container', name, body = {}}, protocol) {
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'i-container'})
        const shadow = el.attachShadow({mode: 'closed'})
        const content = make_element({name: 'section', classlist: 'content'})
        const map = bubble_map({name: 'counts-map'}, container_protocol('counts-map'))
        content.append(map)
        // !important style_sheet must be implemented before shadow 
        // For Safari and Firefox cannot implement shadow before style
        style_sheet(shadow, style)
        shadow.append(content)
        return el

        function container_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            send(make(msg))
            console.log(msg)
            if (type.match(/load-page/)) return console.log(data.page)
        }
    }

    const style = `
    :host(i-container) {
        display: grid;
    }
    `
    return widget()
}

},{"bel":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js","components/datdot-ui-bubble-map/src":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-bubble-map/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/custom-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = custom_action

function custom_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action custom'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'custom action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/filter-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = filter_action

function filter_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action filter'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'filter action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/footer.js":[function(require,module,exports){
const message_maker = require('message-maker')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
// widgets
const i_nav = require('components/datdot-ui-navigation/src')
const i_actions = require('components/datdot-ui-actions/src')
// call actions
const account_action = require('./account-action')
const search_action = require('./search-action')
const filter_action = require('./filter-action')
const sort_action = require('./sort-action')
const custom_action = require('./custom-action')

module.exports = i_footer
function i_footer ({page = '*', flow = 'ui-footer', name = '.', body = {}, to = '#'}, protocol) {
    const {nav = {}, accounts = [], status = {}} = body
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    
    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'footer', classlist: 'footer'})
        const shadow = el.attachShadow({mode: 'closed'})
        const actions = i_actions( {name: `${name}-actions`, status}, footer_protocol(`${name}-actions`) )
        const navigtaion = i_nav( {name: `${name}-nav`, body: nav, to}, footer_protocol(`${name}-nav`) )
        style_sheet(el, style)
        shadow.append(actions, navigtaion)

        return el

        function handle_close_action_event({type, name, hide}) {
            Object.keys(recipients).forEach( key => {
                const regex = new RegExp(`${name}`)
                if (key.match(regex)) return recipients[`${name}-action`](make({type, data: {hide: !hide}}))
            })
        }
        function handle_open_action_event ({name, type, hide}) {
            if (name === 'planlist') return
            if (name === 'performance') return
            if (name === 'linechart') return
            // check sub-action existed
            if (shadow.querySelector(`.sub-action.${name}`)) {
                Object.keys(recipients).forEach( key => {
                    const regex = new RegExp(`${name}`)
                    if (key.match(regex)) return recipients[`${name}-action`](make({type, data: {hide: !hide}}))
                })
                return 
            }
            // check other sub-action existed and do deleted
            const sub_actions = shadow.querySelectorAll(`.sub-action`)
            const sub_option = ({action, args}) => action({name: `${name}-action`, body: args, hide: !hide}, footer_protocol(`${name}-action`))
            const sub_action =  (name === 'account') ? sub_option({action: account_action, args: accounts})
                                : (name === 'search') ? sub_option({action: search_action})
                                : (name === 'filter') ? sub_option({action: filter_action})
                                : (name.match(/sort/)) ? sub_option({action: sort_action})
                                : (name === 'custom-action') ? sub_option({action: custom_action})
                                : undefined

            if (sub_action) shadow.insertBefore(sub_action, actions)
            if (sub_actions.length > 0) {
                sub_actions.forEach( action => {
                    shadow.removeChild(action)
                })
            }
            return
        }

        function footer_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/ready/)) return send(make(msg))
            if (type.match(/click/)) return send(make(msg))
            if (type.match(/expanded/)) return handle_open_action_event({name: from, type: 'show', hide: data.expanded})
            if (type.match(/collapsed/)) return handle_close_action_event({name: from, type: 'hide', hide: data})
            if (type.match(/tab-selected/)) return send( make({to, type: 'switch-page', data}) )
            if (type.match(/switch-page/)) return send(make(msg))
            if (type.match(/switch-account/)) return send(make(msg))
            if (type.match(/account-changed/)) return recipients[`${name}-actions`](make({type: 'account-changed', data}))
        }
    }
    
    const style = ``

    return widget()
}
},{"./account-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/account-action.js","./custom-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/custom-action.js","./filter-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/filter-action.js","./search-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/search-action.js","./sort-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/sort-action.js","components/datdot-ui-actions/src":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-actions/src/index.js","components/datdot-ui-navigation/src":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-navigation/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js":[function(require,module,exports){
module.exports = make_element

function make_element({name = '', classlist = null, role = undefined }) {
    const el = document.createElement(name)
    if (classlist) ste_class()
    if (role) set_role()
    return el

    function ste_class () {
        el.className = classlist
    }
    
    function set_role () {
        if (role.match(/button|switch/)) {
            const tabindex = role.match(/button|switch/) ? 0 : -1
            el.setAttribute('tabindex',  tabindex)
        }
        el.setAttribute('role', role)
    }
}


},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/make-grid.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/node_modules/message-maker.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/search-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = search_action

function search_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action search'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'search action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/sort-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = sort_action

function sort_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action sort'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'sort action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js":[function(require,module,exports){
module.exports = support_style_sheet
function support_style_sheet (shadow, style) {
    return (() => {
        try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(style)
            shadow.adoptedStyleSheets = [sheet]
            return true 
        } catch (error) { 
            const inject_style = `<style>${style}</style>`
            shadow.innerHTML = `${inject_style}`
            return false
        }
    })()
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/web/head.js":[function(require,module,exports){
module.exports = head

function head (lang = 'UTF-8', title = 'Datdot wallet') {
    document.documentElement.lang = 'en'
    document.title = title
    const lan = document.createElement('meta')
    const viewport = document.createElement('meta')
    const description = document.createElement('meta')
    lan.setAttribute('charset', lang)
    viewport.setAttribute('name', 'viewport')
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no')
    description.setAttribute('name', 'description')
    description.setAttribute('content', 'DatDot Wallet is a crypto wallet for datdot')
    document.head.append(lan, viewport, description)
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/web/wallet.js":[function(require,module,exports){
const wallet = require('..')
const csjs = require('csjs-inject')
const head = require('./head')()
const el = wallet()
document.body.append(el)
// fetch('http://localhost:9966/').then( x => x.text()).then(x => {
//   console.log({x})
// })

const style = csjs`
:root {
    /* define colors ---------------------------------------------*/  
    --b: 0, 0%;
    --r: 100%, 50%;
    --color-white: var(--b), 100%;
    --color-black: var(--b), 0%;
    --color-dark: 223, 13%, 20%;
    --color-deep-black: 222, 18%, 11%;
    --color-red: 358, 99%, 53%;
    --color-amaranth-pink: 329, 100%, 65%;
    --color-persian-rose: 323, 100%, 50%;
    --color-orange: 32, var(--r);
    --color-light-orange: 36, 100%, 55%;
    --color-safety-orange: 27, 100%, 50%;
    --color-deep-saffron: 31, 100%, 56%;
    --color-ultra-red: 348, 96%, 71%;
    --color-flame: 15, 80%, 50%;
    --color-verdigris: 180, 54%, 43%;
    --color-viridian-green: 180, 100%, 63%;
    --color-blue: 214, 100%, 49%;
    --color-heavy-blue: 233, var(--r);
    --color-maya-blue: 205, 96%, 72%;
    --color-slate-blue: 248, 56%, 59%;
    --color-blue-jeans: 204, 96%, 61%;
    --color-dodger-blue: 213, 90%, 59%;
    --color-light-green: 97, 86%, 77%;
    --color-lime-green: 127, 100%, 40%;
    --color-slimy-green: 108, 100%, 28%;
    --color-maximum-blue-green: 180, 54%, 51%;
    --color-deep-green: 136, 79%, 22%;
    --color-green: 136, 82%, 38%;
    --color-lincoln-green: 97, 100%, 18%;
    --color-yellow: 44, 100%, 55%;
    --color-chrome-yellow: 39, var(--r);
    --color-bright-yellow-crayola: 35, 100%, 58%;
    --color-green-yellow-crayola: 51, 100%, 83%;
    --color-purple: 283, var(--r);
    --color-heliotrope: 288, 100%, 73%;
    --color-medium-purple: 269, 100%, 70%;
    --color-electric-violet: 276, 98%, 48%;
    --color-grey33: var(--b), 20%;
    --color-grey66: var(--b), 40%;
    --color-grey70: var(--b), 44%;
    --color-grey88: var(--b), 53%;
    --color-greyA2: var(--b), 64%;
    --color-greyC3: var(--b), 76%;
    --color-greyCB: var(--b), 80%;
    --color-greyD8: var(--b), 85%;
    --color-greyD9: var(--b), 85%;
    --color-greyE2: var(--b), 89%;
    --color-greyEB: var(--b), 92%;
    --color-greyED: var(--b), 93%;
    --color-greyEF: var(--b), 94%;
    --color-greyF2: var(--b), 95%;
    --transparent: transparent;
    /* define font ---------------------------------------------*/
    --snippet-font: Segoe UI Mono, Monospace, Cascadia Mono, Courier New, ui-monospace, Liberation Mono, Menlo, Monaco, Consolas;
    --size12: 1.2rem;
    --size13: 1.3rem;
    --size14: 1.4rem;
    --size15: 1.5rem;
    --size16: 1.6rem;
    --size18: 1.8rem;
    --size20: 2rem;
    --size22: 2.2rem;
    --size24: 2.4rem;
    --size26: 2.6rem;
    --size28: 2.8rem;
    --size30: 3rem;
    --size32: 3.2rem;
    --size34: 3.4rem;
    --size36: 3.6rem;
    --size38: 3.8rem;
    --size40: 4rem;
    --size42: 4.2rem;
    --size44: 4.4rem;
    --size46: 4.6rem;
    --size48: 4.8rem;
    --size50: 5rem;
    --size52: 5.2rem;
    --size54: 5.4rem;
    --size56: 5.6rem;
    --size58: 5.8rem;
    --size60: 6rem;
    --weight100: 100;
    --weight300: 300;
    --weight400: 400;
    --weight600: 600;
    --weight800: 800;
    /* define primary ---------------------------------------------*/
    --primary-body-bg-color: var(--color-greyF2);
    --primary-font: Arial, sens-serif;
    --primary-size: var(--size14);
    --primary-size-hover: var(--primary-size);
    --primary-weight: 300;
    --primary-weight-hover: 300;
    --primary-color: var(--color-black);
    --primary-color-hover: var(--color-white);
    --primary-color-focus: var(--color-black);
    --primary-bg-color: var(--color-white);
    --primary-bg-color-hover: var(--color-black);
    --primary-bg-color-focus: var(--color-greyA2), 0.5;
    --primary-border-width: 1px;
    --primary-border-style: solid;
    --primary-border-color: var(--color-black);
    --primary-border-opacity: 1;
    --primary-radius: 8px;
    --primary-avatar-width: 100%;
    --primary-avatar-height: auto;
    --primary-avatar-radius: 0;
    --primary-disabled-size: var(--primary-size);
    --primary-disabled-color: var(--color-greyA2);
    --primary-disabled-bg-color: var(--color-greyEB);
    --primary-disabled-icon-size: var(--primary-icon-size);
    --primary-disabled-icon-fill: var(--color-greyA2);
    --primary-listbox-option-icon-size: 20px;
    --primary-listbox-option-avatar-width: 40px;
    --primary-listbox-option-avatar-height: auto;
    --primary-listbox-option-avatar-radius: var(--primary-avatar-radius);
    --primary-option-avatar-width: 30px;
    --primary-option-avatar-height: auto;
    --primary-list-avatar-width: 30px;
    --primary-list-avatar-height: auto;
    --primary-list-avatar-radius: var(--primary-avatar-radius);
    /* define icon settings ---------------------------------------------*/
    --primary-icon-size: var(--size16);
    --primary-icon-size-hover: var(--size16);
    --primary-icon-fill: var(--primary-color);
    --primary-icon-fill-hover: var(--primary-color-hover);
    /* define current ---------------------------------------------*/
    --current-size: var(--primary-size);
    --current-weight: var(--primary-weight);
    --current-color: var(--color-white);
    --current-bg-color: var(--color-black);
    --current-icon-size: var(--primary-icon-size);
    --current-icon-fill: var(--color-white);
    --current-list-selected-icon-size: var(--list-selected-icon-size);
    --current-list-selected-icon-fill: var(--color-white);
    --current-list-selected-icon-fill-hover: var(--color-white);
    --current-list-size: var(--current-size);
    --current-list-color: var(--current-color);
    --current-list-bg-color: var(--current-bg-color);
    --current-list-avatar-width: var(--primary-list-avatar-width);
    --current-list-avatar-height: var(--primary-list-avatar-height);
    /* role listbox settings ---------------------------------------------*/
    /*-- collapsed --*/
    --listbox-collapsed-bg-color: var(--primary-bg-color);
    --listbox-collapsed-bg-color-hover: var(--primary-bg-color-hover);
    --listbox-collapsed-icon-size: var(--size14);
    --listbox-collapsed-icon-size-hover: var(--size14);
    --listbox-collapsed-icon-fill: var(--primary-icon-fill);
    --listbox-collapsed-icon-fill-hover: var(--primary-icon-fill-hover);
    --listbox-collapsed-listbox-size: var(--primary-size);
    --listbox-collapsed-listbox-size-hover: var(--primary-size-hover);
    --listbox-collapsed-listbox-weight: var(--primary-weight);
    --listbox-collapsed-listbox-weight-hover: var(--primary-weight);
    --listbox-collapsed-listbox-color: var(--primary-color);
    --listbox-collapsed-listbox-color-hover: var(--primary-color-hover);
    --listbox-collapsed-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
    --listbox-collapsed-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
    --listbox-collapsed-listbox-icon-size: var(--primary-listbox-option-icon-size);
    --listbox-collapsed-listbox-icon-size-hover: var(--primary-listbox-option-icon-size);
    --listbox-collapsed-listbox-icon-fill: var(--color-blue);
    --listbox-collapsed-listbox-icon-fill-hover: var(--color-yellow);
    /*-- expanded ---*/
    --listbox-expanded-bg-color: var(--current-bg-color);
    --listbox-expanded-icon-size: var(--size14);
    --listbox-expanded-icon-fill: var(--color-light-green);
    --listbox-expanded-listbox-size: var(--size20);
    --listbox-expanded-listbox-weight: var(--primary-weight);
    --listbox-expanded-listbox-color: var(--current-color);
    --listbox-expanded-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
    --listbox-expanded-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
    --listbox-expanded-listbox-icon-size: var(--primary-listbox-option-icon-size);
    --listbox-expanded-listbox-icon-fill: var(--color-light-green);
    /* role option settings ---------------------------------------------*/
    --list-bg-color: var(--primary-bg-color);
    --list-bg-color-hover: var(--primary-bg-color-hover);
    --list-selected-icon-size: var(--size16);
    --list-selected-icon-size-hover: var(--list-selected-icon-size);
    --list-selected-icon-fill: var(--primary-icon-fill);
    --list-selected-icon-fill-hover: var(--primary-icon-fill-hover);
    /* role link settings ---------------------------------------------*/
    --link-size: var(--size14);
    --link-size-hover: var(--primary-link-size);
    --link-color: var(--color-heavy-blue);
    --link-color-hover: var(--color-dodger-blue);
    --link-color-focus: var(--color-flame);
    --link-bg-color: transparent;
    --link-icon-size: var(--size30);
    --link-icon-fill: var(--primary-link-color);
    --link-icon-fill-hover: var(--primary-link-color-hover);
    --link-avatar-width: 60px;
    --link-avatar-width-hover: var(--link-avatar-width);
    --link-avatar-height: auto;
    --link-avatar-height-hover: auto;
    --link-avatar-radius: 0;
    --link-disabled-size: var(--primary-link-size);
    --link-disabled-color: var(--color-greyA2);
    --link-disabled-bg-color: transparent;
    --link-disabled-icon-fill: var(--color-greyA2);
    /* role menuitem settings ---------------------------------------------*/
    --menu-size: var(--size15);
    --menu-size-hover: var(--menu-size);
    --menu-weight: var(--primary-weight);
    --menu-weigh-hover: var(--primary-weight);
    --menu-color: var(--primary-color);
    --menu-color-hover: var(--color-grey88);
    --menu-icon-size: 20px;
    --menu-icon-size-hover: var(--menu-icon-size);
    --menu-icon-fill: var(--primary-color);
    --menu-icon-fill-hover: var(--color-grey88);
    --menu-avatar-width: 50px;
    --menu-avatar-width-hover: var(--menu-avatar-width);
    --menu-avatar-height: auto;
    --menu-avatar-height-hover: var(--menu-avatar-height);
    --menu-avatar-radius: 0;
    --menu-disabled-color: var(--primary-disabled-color);
    --menu-disabled-size: var(--menu-size);
    --menu-disabled-weight: var(--primary-weight);
  }
  html {
    font-size: 62.5%;
    height: 100%;
  }
  *, *:before, *:after {
    box-sizing: border-box;
    position: relative;
  }
  body {
    -webkit-text-size-adjust: 100%;
    margin: 0;
    padding: 0;
    font-size: calc(var(--primary-size) + 2px);
    font-family: var(--primary-font);
    color: var(--primary-color);
    background-color: hsl( var(--primary-body-bg-color) );
    height: 100%;
    overflow: hidden;
  }
  img {
    width: 100%;
    height: auto;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    padding: 0;
  }
`
},{"..":"/Users/bxbcats/prj/play/web/datdot-wallet/src/datdot-wallet.js","./head":"/Users/bxbcats/prj/play/web/datdot-wallet/web/head.js","csjs-inject":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/index.js"}]},{},["/Users/bxbcats/prj/play/web/datdot-wallet/web/wallet.js"]);
