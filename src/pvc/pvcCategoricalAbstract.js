/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */

pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,

    yScale: null,
    xScale: null,

    prevMax: null,
    prevMin: null,


    constructor: function(o){

        this.base(o);

        var _defaults = {
            showAllTimeseries: false, // meaningless here
            showXScale: true,
            showYScale: true,
            yAxisPosition: "left",
            xAxisPosition: "bottom",
            yAxisSize: 50,
            xAxisSize: 50,
            xAxisFullGrid: false,
            yAxisFullGrid: false,

            secondAxis: false,
            secondAxisIdx: -1,
            secondAxisIndependentScale: false,
            secondAxisOriginIsZero: true,
            secondAxisOffset: 0,
            secondAxisColor: "blue",
            secondAxisSize: 0 // calculated

        };


        // Apply options
        $.extend(this.options,_defaults, o);

        // Sanitize some options:
        if (this.options.showYScale == false){
            this.options.yAxisSize = 0
        }
        if (this.options.showXScale == false){
            this.options.xAxisSize = 0
        }

        if(this.options.secondAxis && this.options.secondAxisIndependentScale){
            this.options.secondAxisSize = this.options.orientation=="vertical"?this.options.yAxisSize:this.options.xAxisSize;
        }
        else{
            this.options.secondAxisSize = 0;
        }

    },

    preRender: function(){


        this.base();

        pvc.log("Prerendering in CategoricalAbstract");

        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        this.secondScale =  this.options.secondAxisIndependentScale?this.getSecondScale(): this.getLinearScale();


        // Generate axis

        this.generateSecondXAxis(); // this goes before the other because of the fullGrid
        this.generateXAxis();
        this.generateSecondYAxis(); // this goes before the other because of the fullGrid
        this.generateYAxis();




    },


    /*
     * Generates the X axis. It's in a separate function to allow overriding this value
     */

    generateXAxis: function(){

        if (this.options.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: this.options.xAxisPosition,
                axisSize: this.options.xAxisSize,
                oppositeAxisSize: this.options.yAxisSize,
                fullGrid:  this.options.xAxisFullGrid,
                elements: this.getAxisOrdinalElements()
            });

            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.appendTo(this.basePanel); // Add it

        }


    },


    /*
     * Generates the Y axis. It's in a separate function to allow overriding this value
     */

    generateYAxis: function(){

        if (this.options.showYScale){
            this.yAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: this.options.yAxisPosition,
                axisSize: this.options.yAxisSize,
                oppositeAxisSize: this.options.xAxisSize,
                fullGrid:  this.options.yAxisFullGrid,
                elements: this.getAxisOrdinalElements()
            });

            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it

        }

    },


    /*
     * Generates the second axis for X, if exists and only for vertical horizontal charts
     */

    generateSecondXAxis: function(){

        if( this.options.secondAxisIndependentScale && this.options.orientation == "horizontal"){
            this.secondXAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[this.options.xAxisPosition],
                axisSize: this.options.secondAxisSize,
                oppositeAxisSize: this.options.yAxisSize,
                fullGrid:  false, // not supported
                elements: this.getAxisOrdinalElements(),
                tickColor: this.options.secondAxisColor
            });

            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /*
     * Generates the second axis for Y, if exists and only for vertical horizontal charts
     */

    generateSecondYAxis: function(){

        if( this.options.secondAxisIndependentScale && this.options.orientation == "vertical"){

            this.secondYAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[this.options.yAxisPosition],
                axisSize: this.options.secondAxisSize,
                oppositeAxisSize: this.options.xAxisSize,
                fullGrid:  false, // not supported
                elements: this.getAxisOrdinalElements(),
                tickColor: this.options.secondAxisColor
            });

            this.secondYAxisPanel.setScale(this.secondScale);
            this.secondYAxisPanel.appendTo(this.basePanel); // Add it

        }
    },



    /*
     * Indicates if xx is an ordinal scale
     */

    isXAxisOrdinal: function(){
        return this.options.orientation == "vertical" && !this.options.timeSeries;
    },


    /*
     * Indicates if yy is an ordinal scale
     */

    isYAxisOrdinal: function(){
        return this.options.orientation == "horizontal" && !this.options.timeSeries;
    },

    /*
     *  List of elements to use in the axis ordinal
     *
     */
    getAxisOrdinalElements: function(){
        return this.dataEngine.getCategories();
    },



    /*
     * xx scale for categorical charts
     */

    getXScale: function(){

        return this.options.orientation == "vertical"?
        (this.options.timeSeries?this.getTimeseriesScale():this.getOrdinalScale()):
        this.getLinearScale();

    },

    /*
     * yy scale for categorical charts
     */

    getYScale: function(){

        return this.options.orientation == "vertical"?
        this.getLinearScale():
        (this.options.timeSeries?this.getTimeseriesScale():this.getOrdinalScale());
    },

    /*
     * Scale for the ordinal axis. xx if orientation is vertical, yy otherwise
     *
     */
    getOrdinalScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var secondXAxisSize = 0, secondYAxisSize = 0;
        
        if( this.options.orientation == "vertical"){
            secondYAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }
        else{
            secondXAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }

        var scale = new pv.Scale.ordinal(this.dataEngine.getVisibleCategories());

        var size = this.options.orientation=="vertical"?this.basePanel.width:this.basePanel.height;

        if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size - secondYAxisSize;
        }
        else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
            scale.min = secondYAxisSize;
            scale.max = size-yAxisSize;
        }
        else{
            scale.min = secondYAxisSize;
            scale.max = size - xAxisSize - secondXAxisSize;
        }
        scale.splitBanded( scale.min, scale.max, this.options.panelSizeRatio);
        return scale;



    },

    /*
     * Scale for the linear axis. yy if orientation is vertical, xx otherwise
     *
     */
    getLinearScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var isVertical = this.options.orientation=="vertical"
        var size = isVertical?this.basePanel.height:this.basePanel.width;

        var max, min;

        if(this.options.stacked){
            max = this.dataEngine.getCategoriesMaxSumOfVisibleSeries();
            min = 0;
        }
        else{
            max = this.dataEngine.getVisibleSeriesAbsoluteMax();
            min = this.dataEngine.getVisibleSeriesAbsoluteMin();

        }
        if(min > 0 && this.options.originIsZero){
            min = 0
        }

        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.axisOffset;
        var scale = new pv.Scale.linear(min - offset,max + offset)


        if( !isVertical && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;
            
        }
        else if( !isVertical && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        return scale;

    },

    /*
     * Scale for the timeseries axis. xx if orientation is vertical, yy otherwise
     *
     */
    getTimeseriesScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;
        var secondAxisSize = bypassAxis?0:this.options.secondAxisSize;

        var size = this.options.orientation=="vertical"?
        this.basePanel.width:
        this.basePanel.height;

        var parser = pv.Format.date(this.options.timeSeriesFormat);
        var categories =  this.dataEngine.getVisibleCategories().sort(function(a,b){
            return parser.parse(a) - parser.parse(b)
        });


        // Adding a small offset to the scale:
        var max = parser.parse(categories[categories.length -1]);
        var min = parser.parse(categories[0]);
        var offset = (max.getTime() - min.getTime()) * this.options.axisOffset;

        var scale = new pv.Scale.linear(new Date(min.getTime() - offset),new Date(max.getTime() + offset));

        if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;
            
        }
        else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range( scale.min , scale.max);
        return scale;


    },

    /*
     * Scale for the linear axis. yy if orientation is vertical, xx otherwise
     *
     */
    getSecondScale: function(bypassAxis){

        if(!this.options.secondAxisIndependentScale){
            return this.getLinearScale(bypassAxis);
        }

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var isVertical = this.options.orientation=="vertical"
        var size = isVertical?this.basePanel.height:this.basePanel.width;

        var max = this.dataEngine.getSecondAxisMax();
        var min = this.dataEngine.getSecondAxisMin();

        if(min > 0 && this.options.secondAxisOriginIsZero){
            min = 0
        }

        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.secondAxisOffset;
        var scale = new pv.Scale.linear(min - offset,max + offset)


        if( !isVertical && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;

        }
        else if( !isVertical && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        return scale;

    }

}
)


/*
 * AxisPanel panel.
 *
 * 
 */
pvc.AxisPanel = pvc.BasePanel.extend({

    _parent: null,
    pvRule: null,
    pvLabel: null,
    pvRuleGrid: null,

    ordinal: false,
    anchor: "bottom",
    axisSize: 30,
    tickLength: 6,
    tickColor: "#aaa",
    oppositeAxisSize: 30,
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    elements: [], // To be used in ordinal scales


    constructor: function(chart, options){

        this.base(chart,options);

    },

    create: function(){

        // Size will depend only on the existence of the labels


        if (this.anchor == "top" || this.anchor == "bottom"){
            this.width = this._parent.width;
            this.height = this.axisSize;
        }
        else{
            this.height = this._parent.height;
            this.width = this.axisSize;
        }


        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)

        this.renderAxis();

        // Extend panel
        this.extend(this.pvPanel, this.panelName + "_");
        this.extend(this.pvRule, this.panelName + "Rule_");
        this.extend(this.pvLabel, this.panelName + "Label_");
        this.extend(this.pvRuleGrid, this.panelName + "Grid_");

    },


    setScale: function(scale){
        this.scale = scale;
    },

    renderAxis: function(){

        var scaleRange = this.scale.range();
        this.pvRule = this.pvPanel
        .add(pv.Rule)
        .strokeStyle(this.tickColor)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale.min)
        [pvc.BasePanel.paralelLength[this.anchor]](this.scale.max - this.scale.min)

        if (this.ordinal == true){
            this.renderOrdinalAxis();
        }
        else{
            this.renderLinearAxis();
      
        }
    
    },
  

    renderOrdinalAxis: function(){

        var myself = this;
    
        this.pvLabel = this.pvRule.add(pv.Label)
        .data(this.elements)
        [pvc.BasePanel.paralelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](10)
        [pvc.BasePanel.relativeAnchor[this.anchor]](function(d){
            return myself.scale(d) + myself.scale.range().band/2;
        })
        .textAlign("center")
        .textBaseline("middle")
        .text(pv.identity)
        .font("9px sans-serif")
    },


    renderLinearAxis: function(){

        var myself = this;
    
        var scale = this.scale;

        this.pvLabel = this.pvRule.add(pv.Rule)
        .data(this.scale.ticks())
        [pvc.BasePanel.paralelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale)
        [pvc.BasePanel.orthogonalLength[this.anchor]](function(d){
            return myself.tickLength/(this.index%2 + 1)
        })
        .strokeStyle(this.tickColor)
        .anchor(this.anchor)
        .add(pv.Label)
        .text(scale.tickFormat)
        .font("9px sans-serif")
        .visible(function(d){
            // mini grids
            if (this.index % 2){
                return false;
            }
            // also, hide the first and last ones
            if( scale(d) == 0  || scale(d) == scale.range()[1] ){
                return false;
            }
            return true;
        })


        // Now do the full grids
        if(this.fullGrid){

            this.pvRuleGrid = this.pvRule.add(pv.Rule)
            .data(scale.ticks())
            .strokeStyle("#f0f0f0")
            [pvc.BasePanel.paralelLength[this.anchor]](null)
            [pvc.BasePanel.oppositeAnchor[this.anchor]](- this._parent[pvc.BasePanel.orthogonalLength[this.anchor]] +
                this[pvc.BasePanel.orthogonalLength[this.anchor]])
            [pvc.BasePanel.relativeAnchor[this.anchor]](scale)
            [pvc.BasePanel.orthogonalLength[this.anchor]](this._parent[pvc.BasePanel.orthogonalLength[this.anchor]] -
                this[pvc.BasePanel.orthogonalLength[this.anchor]])
            .visible(function(d){
                // mini grids
                if (this.index % 2){
                    return false;
                }
                // also, hide the first and last ones
                if( scale(d) == 0  || scale(d) == scale.range()[1] ){
                    return false;
                }
                return true;
            })
        }


    }



});

/*
 * XAxisPanel panel.
 *
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

    anchor: "bottom",
    panelName: "xAxis",

    constructor: function(chart, options){

        this.base(chart,options);

    }

});


/*
 * YAxisPanel panel.
 *
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

    anchor: "left",
    panelName: "yAxis",
    pvRule: null,

    constructor: function(chart, options){

        this.base(chart,options);

    }



});