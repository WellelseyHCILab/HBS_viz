//This file is a continuation of vizTues.js

var margin = {top: 20, right: 20, bottom: 30, left: 100},
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .rangeRound([height, 0]);

var color = d3.scale.ordinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));


var svg = d3.select("body").append("svg")
    //.attr("width", width + margin.left + margin.right)
    .attr("width", width + margin.left + margin.right +200)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
/*
//trying to move legend outside of the graph area
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var inner = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
*/



var active_link = "0"; //to control legend selections and hover
var legendClicked; //to control legend selections
var legendClassArray = []; //store legend classes to select bars in plotSingle()
var y_orig; //to store original y-posn

d3.csv("hbs_data.csv", function(error, data) {
  if (error) throw error;

  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "Week"; }));

  data.forEach(function(d) {
    var myweek = d.Week; //add to stock code
    var y0 = 0;
    //d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
    d.ages = color.domain().map(function(name) { return {myweek:myweek, name: name, y0: y0, y1: y0 += +d[name]}; });
    d.total = d.ages[d.ages.length - 1].y1;

  });


  //scale the range of the data
  x.domain(data.map(function(d) { return d.Week; }));
  y.domain([0, d3.max(data, function(d) { return d.total; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");
      //.text("Population");

  var week = svg.selectAll(".week")
      .data(data)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + "0" + ",0)"; });
      //.attr("transform", function(d) { return "translate(" + x(d.Week) + ",0)"; })

  week.selectAll("rect")
      .data(function(d) {
        return d.ages; 
      })
    .enter().append("rect")
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.y1); })
      .attr("x",function(d) { //add to stock code
          return x(d.myweek)
        })
      .attr("height", function(d) { return y(d.y0) - y(d.y1); })
      .attr("class", function(d) {
        classLabel = d.name.replace(/\s/g, ''); //remove spaces
        return "class" + classLabel;
      })
      .style("fill", function(d) { return color(d.name); });

  week.selectAll("rect")
       .on("mouseover", function(d){

          var delta = d.y1 - d.y0;
          var xPos = parseFloat(d3.select(this).attr("x"));
          var yPos = parseFloat(d3.select(this).attr("y"));
          var height = parseFloat(d3.select(this).attr("height"))

          d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);

          svg.append("text")
          .attr("x",xPos)
          .attr("y",yPos +height/2)
          .attr("class","tooltip")
          .text(d.name +": "+ delta); 
          
       })
       .on("mouseout",function(){
          svg.select(".tooltip").remove();
          d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);
                                
        })



  var legend = svg.selectAll(".legend")
      .data(color.domain().slice().reverse())
    .enter().append("g")
      //.attr("class", "legend")
      .attr("class", function (d) {
        legendClassArray.push(d.replace(/\s/g, '')); //remove spaces
        return "legend";
      })
      .attr("transform", function(d, i) { return "translate(150," + (i * 20) + ")"; }); 
      //.attr("transform", function(d, i) { return "translate(" + (width - 600) + "," + (margin.top + i) * 20 + ")"; }); 


  //reverse order to match order in which bars are stacked    
  legendClassArray = legendClassArray.reverse();
  
  active_list = [];
  class_keep = [];  //don't need

  legend.append("rect")
      .attr("x", width)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color)
      .attr("id", function (d, i) {
        return "id" + d.replace(/\s/g, '');
      })
      
      .on("click",function(d){        
        //get active link
        active_link = this.id.split("id").pop(); //active link = name of column selected
        console.log(active_link);
        
        //if active link is in active_list, remove it
        if (active_list.includes(active_link)){ 
          active_list.remove(active_link);
          d3.select(this)           
            .style("stroke", "none");

          restorePlot(this);
        }
        //else add it to active list, and plotSingle
        else{
          active_list.push(active_link);
          //draw black outline
          d3.select(this)           
            .style("stroke", "black")
            .style("stroke-width", 2);

          plotSingle(this);
        }                      
      });

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
  

  //for all ds, restore    

  temp = [];
  
  //only for one d
  function restorePlot(d) {
    console.log("restoring");
    console.log(d);
    
    last_elem = selected_d_objects.length - 1;
    
    //push all other cols above removed one into temp array
    while(selected_d_objects[last_elem] != d){
      temp.push(selected_d_objects[last_elem]);
      last_elem--;
    }
   
    console.log("ERASING WORKS FINE");   
    //erase deselected column d 
    temp.unshift(d);  //add d to temp so that it can be erased
    
    
    //erase columns above d
    for (i = 0; i < temp.length; i++) {
      console.log(temp[i].id.split("id").pop());
      d3.selectAll(".class" + temp[i].id.split("id").pop())  
        .transition()
        //.duration(500)
        .style("opacity", 0);
    }

    console.log("UPDATING Y LIST--SHOULD BE HANDLED");   

    //update y_new_list
    week.selectAll("rect").forEach(function (d, i) {  
      //get height and y posn of base bar and selected bar
      h_keep = d3.select(d[idx]).attr("height");
      //console.log("h_keep: " + h_keep);      
      new_y_list[i] =  parseInt(new_y_list[i])+ parseInt(h_keep);     

    })
    console.log("new_y_list");
    console.log(new_y_list);

    //remove desired column
    selected_d_objects.remove(d);
    temp.remove(d);

    temp.reverse();
    console.log(temp);
   
	//go through all elements in temp and try to re graph them
    for(i = 0; i < temp.length; i++){
      //plotWithTimeout( i);
      setTimeout(function( i) {
        console.log("inside timeout");  //undefined
        
      }, 1000)
      console.log("temp[i]: ");
      console.dir(temp[i]);
      console.log("temp.length: " + temp.length);
      plotSingle(temp[i]);
    }
  
  
  }

  function plotWithTimeout(i){
    console.log(temp[i]);
    setTimeout(function( i) {
        console.log("inside timeout");  //undefined
        
      }, 1000)
    console.log(temp[i]);
    plotSingle(temp[i]);
  }

  //dict of all original y positions to help with restoration
  //key: d, value: y_keep
  y_orig = [];  
  new_y_list = []; //array of the next y position to plot single col onto
  selected_cols = []; 
  selected_d_objects = [];

  function plotSingle(d) {
    console.log("I am plotting this rectangle d:");
    console.log(d);
    col = d.id.split("id").pop(); //the column name that we selected
    idx = legendClassArray.indexOf(col); 
    //holds dict: key: col, value:index
    class_keep.push({
      key: col,
      value: idx
    });
  
    selected_cols.push(col);

    //erase all but selected bars by setting opacity to 0
    //legendClassArray holds all col names
    for (i = 0; i < legendClassArray.length; i++) {
      //if not already erased, then erase
      if (!selected_cols.includes(legendClassArray[i])) {
        d3.selectAll(".class" + legendClassArray[i])
          .transition()
          .duration(1000)          
          .style("opacity", 0);
      } else { //previously erased, now unerase

        d3.selectAll(".class" + legendClassArray[i])
          .transition()
          .duration(200)          
          .style("opacity", 1);
      }
    }

    //store the height and y pos of original, full graph
    orig_height_y = [];
 

    //lower the bars to start on x-axis
    
    if(selected_cols.length == 1){
      console.log("case 1");
      count = 1;
      week.selectAll("rect").forEach(function (d, i) {  
        //get height and y posn of base bar and selected bar
        h_keep = d3.select(d[idx]).attr("height");
        y_keep = d3.select(d[idx]).attr("y");
      
        //store y_base in array to restore plot
        y_orig.push({
          key: d[idx],
          value: y_keep
        });
        console.log(y_orig);

        h_base = d3.select(d[0]).attr("height");
        y_base = d3.select(d[0]).attr("y");   
      
        h_shift = h_keep - h_base;
        y_new = y_base - h_shift;
     
        new_y_list.push(y_new);
        //reposition selected bars
        d3.select(d[idx])
          .transition()
          .duration(500)
          .delay(500)
          .attr("y", y_new);
        
      	count++;
      })   
      console.log("CASE 1: AFTER ADDING COLUMN, WHAT'S THE VALUE INSIDE NEW_Y_LIST?");
      console.log(new_y_list);
      
    } else if (selected_cols.length > 1){
      console.log("case > 1");
      count = 1;
      week.selectAll("rect").forEach(function (d, i) {  
        //get height and y posn of base bar and selected bar
        h_keep = d3.select(d[idx]).attr("height");
        y_keep = d3.select(d[idx]).attr("y");
        
        //store y_base in array to restore plot
        y_orig.push({
          key: d,
          value: y_keep
        });

        
        y_new = new_y_list[i] - h_keep;
        
        new_y_list[i] = y_new;
        console.log("y stuff");
        //reposition selected bars
        d3.select(d[idx])
          .transition()
          .duration(500)
          .delay(500)
          .attr("y", y_new);
        
      count++;
      }) 
	console.log("CASE >1: AFTER ADDING COLUMN, WHAT'S THE VALUE INSIDE NEW_Y_LIST?");
      console.log(new_y_list);

    } else {
      console.log("unforseen case");
    }

    selected_d_objects.push(d);
    console.log("DONE");
  } 
  
});

//Prototype to remove object from array, removes first
//matching object only
Array.prototype.remove = function (v) {
    if (this.indexOf(v) != -1) {
        this.splice(this.indexOf(v), 1);
        return true;
    }
    return false;
}