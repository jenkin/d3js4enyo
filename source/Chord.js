enyo.kind({
    name: "d3.Chord",
    kind: "d3.Svg",
    classes: "chord",
    events: { 
        onChordClick: "",
        onChordMouseover: "",
        onNodeClick: "",
        onNodeMouseover: ""
    },
    published: {
        fileNodes: "",
        fileMatrix: "",
        nodes: "",
        matrix: "",
        details: "",
        subdetails: "",
        onNodeLabel: "onnodelabel",
        onNodeText: "onnodetext",
        onNodeColor: "onnodecolor",
        onChordLabel: "onchordlabel",
        onChordColor: "onchordcolor",
        onSortGroups: "onsortgroups",
        rotateGroups: 0,
        rotateAngle: 0,
        paddingGroups: 0.04,
        onSortSubgroups: "onsortsubgroups",
        onSortChords: "onsortchords",
        duration: 1000
    },
    d3: {
        arc: "",
        layout: "",
        path: "",
        nodeGroup: "",
        nodePath: "",
        chordPath: "",
        g: ""
    },
    rendered: function() {
        if (this.container.kind !== this.kind) {
            this.inherited(arguments);
        }
        this.draw();
    },
    draw: function() {

        var kind = this;
        
        var w = kind.getWidth(),
            h = kind.getHeight(),
            outerRadius = Math.min(w, h) / 2,
            innerRadius = outerRadius - 24;

        kind.d3.arc = d3.svg.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius);

        kind.d3.layout = d3.layout.chord()
                        .padding(kind.paddingGroups)
                        .sortGroups(kind[kind.onSortGroups])
                        .sortSubgroups(kind[kind.onSortSubgroups])
                        .sortChords(kind[kind.onSortChords]);

        kind.d3.path = d3.svg.chord()
                        .radius(innerRadius);

        // Compute the chord layout.
        kind.d3.layout.matrix(kind.matrix);

        // Reverse clockwise rotation of diagram in groups' steps.
        kind.rotateAngle = kind.calcRotateAngle();
        
        kind.d3.g = kind.d3.svg
                        .append("g")
                        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")rotate(" + (-kind.rotateAngle * 180 / Math.PI) + ")");

        kind.d3.g.append("circle")
                        .attr("r", outerRadius);

        // Add a group per neighborhood.
        kind.d3.nodeGroup = kind.d3.g.selectAll(".group")
                        .data(kind.d3.layout.groups)
                        .enter().append("g")
                        .attr("class", "group")
                        .on("mouseover", function(d,i) {
                            kind.doNodeMouseover({data: d, index: i});
                        })
                        .on("click", function(d,i) {
                            kind.doNodeClick({data: d, index: i});
                        });

        // Add a mouseover title.
        kind.d3.nodeGroup.append("title").text(function(d,i) {
            return kind.oncontrol.call(kind,"onNodeLabel",d,i);
        });

        // Add the node arc.
        kind.d3.nodePath = kind.d3.nodeGroup.append("path")
                        .attr("id", function(d, i) { return kind.id + "_group" + i; })
                        .attr("d", kind.d3.arc)
                        .style("fill", function(d, i) { 
                            return kind.oncontrol.call(kind,"onNodeColor",d,i);
                        })
                        .each(function(d) { this._current = d; });

        // Add a text label.
        var nodeText = kind.d3.nodeGroup.append("text")
                        .attr("x", 6)
                        .attr("dy", 15);

        nodeText.append("textPath")
                        .attr("xlink:href", function(d, i) { return "#" + kind.id + "_group" + i; })
                        .text(function(d, i) { 
                            return kind.oncontrol.call(kind,"onNodeText",d,i);
                        });

        // Remove the labels that don't fit. :(
        nodeText.filter(function(d, i) { 
            return kind.d3.nodePath[0][i].getTotalLength() / 2 - 25 < this.getComputedTextLength(); 
        }).remove();

        // Add the chords.
        kind.d3.chordPath = kind.d3.g.selectAll(".chord")
                        .data(kind.d3.layout.chords)
                        .enter().append("path")
                        .attr("class", "chord")
                        .style("fill", function(d,i) { return kind.oncontrol.call(kind,"onChordColor",d,i); })
                        .attr("d", kind.d3.path)
                        .on("mouseover",function(d,i) {
                            kind.doChordMouseover({data: d, index: i});
                        })
                        .on("click",function(d,i) {
                            kind.doChordClick({data: d, index: i});
                        });

        // Add an elaborate mouseover title for each chord.
        kind.d3.chordPath.append("title").text(function(d,i) {
            return kind.oncontrol.call(kind,"onChordLabel",d,i);
        });
    },
    redraw: function() {
        var kind = this;

        //kind.d3.g.transition().duration(kind.duration)
            //.attr("transform", "translate(" + kind.getWidth() / 2 + "," + kind.getHeight() / 2 + ")rotate(" + (-kind.rotateAngle * 180 / Math.PI) + ")");
        
        var nodeGroup = kind.d3.nodeGroup.data(kind.d3.layout.groups);
        nodeGroup.exit().remove();
        nodeGroup.enter().append("g")
            .attr("class", "group")
            .on("mouseover", function(d,i) {
                kind.doNodeMouseover({data: d, index: i});
            })
            .on("click", function(d,i) {
                kind.doNodeClick({data: d, index: i});
            })
            .append("path")
            .attr("id", function(d, i) { return kind.id + "_group" + i; })
            .style("fill", function(d, i) { return kind.oncontrol.call(kind,"onNodeColor",d,i); })
            .each(function(d) { this._current = d; });

        kind.d3.nodeGroup = kind.d3.g.selectAll(".group");
        kind.d3.nodeGroup.select("title").remove();
        kind.d3.nodeGroup.append("title").text(function(d,i) {
                return kind.oncontrol.call(kind,"onNodeLabel",d,i);
            });
        
        kind.d3.nodePath = kind.d3.nodeGroup.select("path");
        kind.d3.nodePath
            .transition()
            .duration(kind.duration)
            .attrTween("d", function(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) {
                    return kind.d3.arc(i(t));
                };
            });
        
        kind.d3.nodeGroup.select("text").remove();
        var groupText = kind.d3.nodeGroup.append("text").attr("x", 6).attr("dy", 15);
        groupText.append("textPath")
            .attr("xlink:href", function(d, i) { return "#" + kind.id + "_group" + i; })
            .text(function(d, i) { return kind.oncontrol.call(kind,"onNodeText",d,i); });
        groupText.filter(function(d, i) { return kind.d3.nodePath[0][i].getTotalLength() / 2 - 25 < this.getComputedTextLength(); })
            .remove();

        var chordPath = kind.d3.chordPath.data(kind.d3.layout.chords);
        chordPath.exit().remove();
        chordPath.enter().append("path")
            .attr("class", "chord")
            .style("fill", function(d,i) { return kind.oncontrol.call(kind,"onChordColor",d,i); }) 
            .on("mouseover",function(d,i) {
                kind.doChordMouseover({data: d, index: i});
            })
            .on("click",function(d,i) {
                kind.doChordClick({data: d, index: i});
            });
        
        kind.d3.chordPath = kind.d3.g.selectAll(".chord");
        kind.d3.chordPath
            .transition()
            .duration(kind.duration)
            .attr("d", kind.d3.path);
        
        kind.d3.chordPath.select("title").remove();
        kind.d3.chordPath.append("title").text(function(d,i) {
            return kind.oncontrol.call(kind,"onChordLabel",d,i);
        });
    },
    oncontrol: function(c,d,i) { // Nome controllo, parametri
        if (typeof this.owner[this[c]] === "function") {
            return this.owner[this[c]].call(this.owner,d,i);
        } else if (typeof this[this[c]] === "function") {
            return this[this[c]].call(this,d,i);
        } else {
            enyo.error("Funzione " + this[c] + " per " + c + " non riconosciuta!");
            return;
        }
    },
    onnodelabel: function(d,i) {
        return this.nodes[i].name + ": " + Math.round(d.value) + " trasferimenti";
    },
    onnodetext: function(d,i) {
        return this.nodes[i].name;
    },
    onnodecolor: function(d,i) {
        return this.nodes[i].color;
    },
    onchordlabel: function(d,i) {
        return this.nodes[d.source.index].name
                    + " → " + this.nodes[d.target.index].name
                    + ": " + d.source.value
                    + "\n" + this.nodes[d.target.index].name
                    + " → " + this.nodes[d.source.index].name
                    + ": " + d.target.value;
    },
    onchordcolor: function(d,i) {
        //var genRand = function(from,to) { return Math.floor(Math.random()*(to-from+1)+from); };
        return this.nodes[d.source.index].color; //colorbrewer.Pastel2['8'][genRand(0,7)]; //this.nodes[d.source.index].color;
    },
    onsortgroups: d3.descending,
    onsortsubgroups: d3.descending,
    onsortchords: d3.descending,
    calcRotateAngle: function() {
        if (this.rotateGroups) {
            var groups = this.d3.layout.groups().slice(0);
            groups.sort(function(a,b) { return a.startAngle > b.startAngle ? 1 : -1;});
            var subgroups = groups.slice(0,this.rotateGroups);
            return subgroups.pop().endAngle + this.paddingGroups;
        } else {
            return 0;
        }
    },
    matrixChanged: function() {
        this.d3.layout = this.d3.layout.matrix(this.matrix);
        this.rotateAngle = this.calcRotateAngle();
        this.redraw();
    }
});
