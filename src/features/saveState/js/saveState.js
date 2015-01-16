(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @name ui.grid.saveState
   * @description
   *
   *  # ui.grid.saveState
   * This module provides the ability to save the grid state, and restore
   * it when the user returns to the page.  
   * 
   * No UI is provided, the caller should provide their own UI/buttons 
   * as appropriate. Usually the navigate events would be used to save
   * the grid state and restore it.
   * 
   * <br/>
   * <br/>
   *
   * <div doc-module-components="ui.grid.save-state"></div>
   */

  var module = angular.module('ui.grid.saveState', ['ui.grid', 'ui.grid.selection', 'ui.grid.cellNav']);

  /**
   *  @ngdoc object
   *  @name ui.grid.saveState.constant:uiGridSaveStateConstants
   *
   *  @description constants available in save state module
   */

  module.constant('uiGridSaveStateConstants', {
    featureName: 'saveState'
  });

  /**
   *  @ngdoc service
   *  @name ui.grid.saveState.service:uiGridSaveStateService
   *
   *  @description Services for saveState feature
   */
  module.service('uiGridSaveStateService', ['$q', 'uiGridSaveStateConstants', 'gridUtil', '$compile', '$interval', 'uiGridConstants',
    function ($q, uiGridSaveStateConstants, gridUtil, $compile, $interval, uiGridConstants ) {

      var service = {

        initializeGrid: function (grid) {

          //add feature namespace and any properties to grid for needed state
          grid.saveState = {};
          this.defaultGridOptions(grid.options);

          /**
           *  @ngdoc object
           *  @name ui.grid.saveState.api:PublicApi
           *
           *  @description Public Api for saveState feature
           */
          var publicApi = {
            events: {
              saveState: {
              }
            },
            methods: {
              saveState: {
                /**
                 * @ngdoc function
                 * @name save
                 * @methodOf  ui.grid.saveState.api:PublicApi
                 * @description Packages the current state of the grid into 
                 * an object, and provides it to the user for saving
                 * @returns {object} the state as a javascript object that can be saved
                 */
                save: function () {
                  return service.save(grid);
                },
                /**
                 * @ngdoc function
                 * @name restore
                 * @methodOf  ui.grid.saveState.api:PublicApi
                 * @description Restores the provided state into the grid
                 * @param {scope} $scope a scope that we can broadcast on
                 * @param {object} state the state that should be restored into the grid
                 */
                restore: function ( $scope, state) {
                  service.restore(grid, $scope, state);
                }
              }
            }
          };

          grid.api.registerEventsFromObject(publicApi.events);

          grid.api.registerMethodsFromObject(publicApi.methods);
          
        },

        defaultGridOptions: function (gridOptions) {
          //default option to true unless it was explicitly set to false
          /**
           * @ngdoc object
           * @name ui.grid.saveState.api:GridOptions
           *
           * @description GridOptions for saveState feature, these are available to be  
           * set using the ui-grid {@link ui.grid.class:GridOptions gridOptions}
           */
          /**
           * @ngdoc object
           * @name saveWidths
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the current column widths.  Note that unless
           * you've provided the user with some way to resize their columns (say
           * the resize columns feature), then this makes little sense.
           * <br/>Defaults to true
           */
          gridOptions.saveWidths = gridOptions.saveWidths !== false;
          /**
           * @ngdoc object
           * @name saveOrder
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the current column order.  Note that unless
           * you've provided the user with some way to reorder their columns (for
           * example the move columns feature), this makes little sense.
           * <br/>Defaults to true
           */
          gridOptions.saveOrder = gridOptions.saveOrder !== false;
          /**
           * @ngdoc object
           * @name saveScroll
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the current scroll position.  Note that this
           * is saved as the percentage of the grid scrolled - so if your
           * user returns to a grid with a significantly different number of 
           * rows (perhaps some data has been deleted) then the scroll won't 
           * actually show the same rows as before.  If you want to scroll to
           * a specific row then you should instead use the saveFocus option, which
           * is the default.
           * 
           * Note that this element will only be saved if the cellNav feature is
           * enabled
           * <br/>Defaults to false
           */
          gridOptions.saveScroll = gridOptions.saveScroll === true;
          /**
           * @ngdoc object
           * @name saveFocus
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the current focused cell.  On returning
           * to this focused cell we'll also scroll.  This option is
           * preferred to the saveScroll option, so is set to true by
           * default.  If saveScroll is set to true then this option will 
           * be disabled.  
           * 
           * By default this option saves the current row number and column 
           * number, and returns to that row and column.  However, if you define
           * a saveRowIdentity function, then it will return you to the currently 
           * selected column within that row (in a business sense - so if some
           * rows have been deleted, it will still find the same data, presuming it 
           * still exists in the list.  If it isn't in the list then it will instead
           * return to the same row number - i.e. scroll percentage)
           * 
           * Note that this option will do nothing if the cellNav
           * feature is not enabled.
           * 
           * <br/>Defaults to true (unless saveScroll is true)
           */
          gridOptions.saveFocus = gridOptions.saveScroll !== true && gridOptions.saveFocus !== false;
          /**
           * @ngdoc object
           * @name saveRowIdentity
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description A function that can be called, passing in a rowEntity, 
           * and that will return a unique id for that row.  This might simply 
           * return the `id` field from that row (if you have one), or it might
           * concatenate some fields within the row to make a unique value.
           * 
           * This value will be used to find the same row again and set the focus 
           * to it, if it exists when we return.
           * 
           * <br/>Defaults to undefined
           */
          /**
           * @ngdoc object
           * @name saveVisible
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save whether or not columns are visible.
           * 
           * <br/>Defaults to true
           */
          gridOptions.saveVisible = gridOptions.saveVisible !== false;          
          /**
           * @ngdoc object
           * @name saveSort
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the current sort state for each column
           * 
           * <br/>Defaults to true
           */
          gridOptions.saveSort = gridOptions.saveSort !== false;         
          /**
           * @ngdoc object
           * @name saveFilter
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the current filter state for each column
           * 
           * <br/>Defaults to true
           */
          gridOptions.saveFilter = gridOptions.saveFilter !== false;
          /**
           * @ngdoc object
           * @name saveSelection
           * @propertyOf  ui.grid.saveState.api:GridOptions
           * @description Save the currently selected rows.  If the `saveRowIdentity` callback
           * is defined, then it will save the id of the row and select that.  If not, then
           * it will attempt to select the rows by row number, which will give the wrong results
           * if the data set has changed in the mean-time.
           * 
           * Note that this option only does anything
           * if the selection feature is enabled.  
           * 
           * <br/>Defaults to true
           */
          gridOptions.saveSelection = gridOptions.saveSelection !== false;          
        },



        /**
         * @ngdoc function
         * @name save
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Saves the current grid state into an object, and
         * passes that object back to the caller
         * @param {Grid} grid the grid whose state we'd like to save
         * @returns {object} the state ready to be saved
         */
        save: function (grid) {
          var savedState = {};
          
          savedState.columns = service.saveColumns( grid );
          savedState.scrollFocus = service.saveScrollFocus( grid );
          savedState.selection = service.saveSelection( grid );
          
          return savedState;
        },
        
        
        /**
         * @ngdoc function
         * @name restore
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Applies the provided state to the grid
         * 
         * @param {Grid} grid the grid whose state we'd like to restore
         * @param {scope} $scope a scope that we can broadcast on
         * @param {object} state the state we'd like to restore
         */
        restore: function( grid, $scope, state ){
          if ( state.columns ) {
            service.restoreColumns( grid, state.columns );
          }
          
          if ( state.scrollFocus ){
            service.restoreScrollFocus( grid, $scope, state.scrollFocus );
          }
          
          if ( state.selection ){
            service.restoreSelection( grid, state.selection );
          }
          
          grid.refresh();
        },
        
        
        /**
         * @ngdoc function
         * @name saveColumns
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Saves the column setup, including sort, filters, ordering
         * and column widths.
         * 
         * Works through the current columns, storing them in order.  Stores the
         * column name, then the visible flag, width, sort and filters for each column.
         *
         * @param {Grid} grid the grid whose state we'd like to save
         * @returns {array} the columns state ready to be saved
         */
        saveColumns: function( grid ) {
          var columns = [];
          angular.forEach( grid.columns, function( column ) {
            var savedColumn = {};
            savedColumn.name = column.name;
            savedColumn.visible = column.visible;
            savedColumn.width = column.width;
            
            // these two must be copied, not just pointed too - otherwise our saved state is pointing to the same object as current state
            savedColumn.sort = angular.copy( column.sort );
            savedColumn.filters = angular.copy ( column.filters );
            columns.push( savedColumn );
          });
          
          return columns;
        },
        

        /**
         * @ngdoc function
         * @name saveScrollFocus
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Saves the currently scroll or focus.
         * 
         * If cellNav isn't present then does nothing - we can't return
         * to the scroll position without cellNav anyway.
         * 
         * If the cellNav module is present, and saveFocus is true, then
         * it saves the currently focused cell.  If rowIdentity is present
         * then saves using rowIdentity, otherwise saves visibleRowNum.
         * 
         * If the cellNav module is not present, and saveScroll is true, then
         * it approximates the current scroll row and column, and saves that.
         * 
         * @param {Grid} grid the grid whose state we'd like to save
         * @returns {object} the selection state ready to be saved
         */
        saveScrollFocus: function( grid ){
          if ( !grid.api.cellNav ){
            return {};
          }
          
          var scrollFocus = {};
          if ( grid.options.saveFocus ){
            scrollFocus.focus = true;
            var rowCol = grid.api.cellNav.getFocusedCell();
            if ( rowCol !== null ) {
              scrollFocus.colName = rowCol.col.colDef.name;
              scrollFocus.rowVal = service.getRowVal( grid, rowCol.row );
            }
          } else if ( grid.options.saveScroll ) {
            scrollFocus.focus = false;
            if ( grid.renderContainers.body.prevRowScrollIndex ){
              scrollFocus.rowVal = service.getRowVal( grid, grid.renderContainers.body.visibleRowCache[ grid.renderContainers.body.prevRowScrollIndex ]);
            }
            
            if ( grid.renderContainers.body.prevColScrollIndex ){
              scrollFocus.colName = grid.renderContainers.body.visibleColumnCache[ grid.renderContainers.body.prevColScrollIndex ].name;
            }
          }        
          
          return scrollFocus;
        },
        

        /**
         * @ngdoc function
         * @name saveSelection
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Saves the currently selected rows, if the selection feature is enabled
         * @param {Grid} grid the grid whose state we'd like to save
         * @returns {object} the selection state ready to be saved
         */
        saveSelection: function( grid ){
          if ( !grid.api.selection ){
            return {};
          }
          
          var selection = grid.api.selection.getSelectedGridRows().map( function( gridRow ) {
            return service.getRowVal( grid, gridRow );
          });
          
          return selection;
        },
        
        
        /**
         * @ngdoc function
         * @name getRowVal
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Helper function that gets either the rowNum or
         * the saveRowIdentity, given a gridRow 
         * @param {Grid} grid the grid the row is in
         * @param {GridRow} gridRow the row we want the rowNum for
         * @returns {object} an object containing { identity: true/false, row: rowNumber/rowIdentity }
         * 
         */
        getRowVal: function( grid, gridRow ){
          if ( !gridRow ) {
            return null;
          }
          
          var rowVal = {};
          if ( grid.options.saveRowIdentity ){
            rowVal.identity = true;
            rowVal.row = grid.options.saveRowIdentity( gridRow.entity );
          } else {
            rowVal.identity = false;
            rowVal.row = grid.renderContainers.body.visibleRowCache.indexOf( gridRow );
          }
          return rowVal;
        },
        
        
        /**
         * @ngdoc function
         * @name restoreColumns
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Restores the columns, including order, visible, width
         * sort and filters.
         * 
         * @param {Grid} grid the grid whose state we'd like to restore
         * @param {object} columnsState the list of columns we had before, with their state
         */
        restoreColumns: function( grid, columnsState ){
          angular.forEach( columnsState, function( columnState, index ) {
            var currentCol = grid.columns.filter( function( column ) {
              return column.name === columnState.name;
            });
            
            if ( currentCol.length > 0 ){
              var currentIndex = grid.columns.indexOf( currentCol[0] );
              
              grid.columns[currentIndex].visible = columnState.visible;
              grid.columns[currentIndex].colDef.visible = columnState.visible;
              grid.columns[currentIndex].width = columnState.width;
              grid.columns[currentIndex].sort = angular.copy( columnState.sort );
              grid.columns[currentIndex].filters = angular.copy( columnState.filters );

              if ( currentIndex !== index ){
                var column = grid.columns.splice( currentIndex, 1 )[0];
                grid.columns.splice( index, 0, column );
              }
            }
          });
        },
        

        /**
         * @ngdoc function
         * @name restoreScrollFocus
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Scrolls to the position that was saved.  If focus is true, then
         * sets focus to the specified row/col.  If focus is false, then scrolls to the 
         * specified row/col.
         * 
         * @param {Grid} grid the grid whose state we'd like to restore
         * @param {scope} $scope a scope that we can broadcast on
         * @param {object} scrollFocusState the scroll/focus state ready to be restored
         */
        restoreScrollFocus: function( grid, $scope, scrollFocusState ){
          if ( !grid.api.cellNav ){
            return;
          }
          
          var colDef, row;
          if ( scrollFocusState.colName ){
            var colDefs = grid.options.columnDefs.filter( function( colDef ) { return colDef.name === scrollFocusState.colName; });
            if ( colDefs.length > 0 ){
              colDef = colDefs[0];
            }
          }
          
          if ( scrollFocusState.rowVal && scrollFocusState.rowVal.row ){
            if ( scrollFocusState.rowVal.identity ){
              row = service.findRowByIdentity( grid, scrollFocusState.rowVal );
            } else {
              row = grid.renderContainers.body.visibleRowCache[ scrollFocusState.rowVal.row ];
            }
          }
          
          var entity = row && row.entity ? row.entity : null ;

          if ( colDef || entity ) {          
            if (scrollFocusState.focus ){
              grid.api.cellNav.scrollToFocus( $scope, entity, colDef );
            } else {
              grid.api.cellNav.scrollTo( $scope, entity, colDef );
            }
          }
        },
        

        /**
         * @ngdoc function
         * @name restoreSelection
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Selects the rows that are provided in the selection
         * state.  If you are using `saveRowIdentity` and more than one row matches the identity
         * function then only the first is selected.
         * @param {Grid} grid the grid whose state we'd like to restore
         * @param {object} selectionState the selection state ready to be restored
         */
        restoreSelection: function( grid, selectionState ){
          if ( !grid.api.selection ){
            return;
          }
          
          grid.api.selection.clearSelectedRows();

          angular.forEach( selectionState, function( rowVal ) {
            if ( rowVal.identity ){
              var foundRow = service.findRowByIdentity( grid, rowVal );
              
              if ( foundRow ){
                grid.api.selection.selectRow( foundRow.entity );
              }
              
            } else {
              grid.api.selection.selectRowByVisibleIndex( rowVal.row );
            }
          });
        },
        
        
        /**
         * @ngdoc function
         * @name findRowByIdentity
         * @methodOf  ui.grid.saveState.service:uiGridSaveStateService
         * @description Finds a row given it's identity value, returns the first found row
         * if any are found, otherwise returns null if no rows are found.
         * @param {Grid} grid the grid whose state we'd like to restore
         * @param {object} rowVal the row we'd like to find
         * @returns {gridRow} the found row, or null if none found
         */
        findRowByIdentity: function( grid, rowVal ){
          if ( !grid.options.saveRowIdentity ){
            return null;
          }
          
          var filteredRows = grid.rows.filter( function( gridRow ) {
            if ( grid.options.saveRowIdentity( gridRow.entity ) === rowVal.row ){
              return true;
            } else {
              return false;
            }
          });
          
          if ( filteredRows.length > 0 ){
            return filteredRows[0];
          } else {
            return null;
          }
        }
      };

      return service;

    }
  ]);

  /**
   *  @ngdoc directive
   *  @name ui.grid.saveState.directive:uiGridSaveState
   *  @element div
   *  @restrict A
   *
   *  @description Adds saveState features to grid
   *
   *  @example
   <example module="app">
   <file name="app.js">
   var app = angular.module('app', ['ui.grid', 'ui.grid.saveState']);

   app.controller('MainCtrl', ['$scope', function ($scope) {
      $scope.data = [
        { name: 'Bob', title: 'CEO' },
        { name: 'Frank', title: 'Lowly Developer' }
      ];

      $scope.gridOptions = {
        columnDefs: [
          {name: 'name'},
          {name: 'title', enableCellEdit: true}
        ],
        data: $scope.data
      };
    }]);
   </file>
   <file name="index.html">
   <div ng-controller="MainCtrl">
   <div ui-grid="gridOptions" ui-grid-save-state></div>
   </div>
   </file>
   </example>
   */
  module.directive('uiGridSaveState', ['uiGridSaveStateConstants', 'uiGridSaveStateService', 'gridUtil', '$compile',
    function (uiGridSaveStateConstants, uiGridSaveStateService, gridUtil, $compile) {
      return {
        replace: true,
        priority: 0,
        require: '^uiGrid',
        scope: false,
        link: function ($scope, $elm, $attrs, uiGridCtrl) {
          uiGridSaveStateService.initializeGrid(uiGridCtrl.grid);
        }
      };
    }
  ]);
})();