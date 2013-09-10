enyo.kind({
    name: "d3.Svg",
    kind: "enyo.Control",
    classes: "d3 svg",
    published: {
        width: 640,
        height: 640,
        duration: 500,
        scaling: 1,
        xScaling: 1,
        yScaling: 1,
        xTranslation: 0,
        yTranslation: 0,
        rotation: 0
    },
    d3: {
        svg: ""
    },
    rendered: function() {
        this.inherited(arguments);
        this.renderSvg();
    },
    renderSvg: function() {
        var w = this.width,
            h = this.height;
        
        var node = this.hasNode();
        if (node !== null) {
            this.d3.svg = d3.select("#"+node.id).append("svg")
                            .attr("width", w)
                            .attr("height", h)
                            .append("g")
                            .attr("transform","translate(" + this.xTranslation + "," + this.yTranslation + ")scale(" + this.xScaling + "," + this.yScaling + ")rotate(" + this.rotation + ")");
        } else {
            console.log("No node");
        }
    },
    scalingChanged: function() {
        this.d3.svg
            .transition()
            .duration(this.duration)
            .attr("transform","translate(" + this.xTranslation + "," + this.yTranslation + ")scale(" + this.scaling + "," + this.scaling + ")rotate(" + this.rotation + ")");
    }
});
