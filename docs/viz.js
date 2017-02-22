//This file is a continuation of vizTues.js
//this function creates the weekly graph

//global variables
var default_view = "Monthly";
var data = null;
//array of user input predictions 
var predictions = [];

function createGraph(view_type){
	var fileName = null;
	var text = null;  //for x-axis label
	
	if(default_view === "Monthly"){
		fileName = "hbs_monthly.csv";
		text = "Month of 2015";
	}else{
		fileName = "hbs_data.csv";
		text = "Week of 2015"
	}
	
	var margin = {top: 20, right: 20, bottom: 60, left: 100},
		width = 960 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
		.rangeRound([height, 0]);

	var color = d3.scale.ordinal()
		.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00", "#990000", "#CD5C5C"]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickFormat(d3.format(".2s"));


	var svg = d3.select("#graph").append("svg")
		//.attr("width", width + margin.left + margin.right)
		.attr("width", width + margin.left + margin.right + 200)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var active_link = "0"; //to control legend selections and hover
	var legendClicked; //to control legend selections
	var legendClassArray = []; //store legend classes to select bars in plotSingle()

	d3.csv(fileName, function(error, data) {
	  if (error) throw error;

	  //if user has entered prediction input, render them in the graph
	  if(predictions != [])
	  	data = inputPredictions(data);
	  
	
	  if(default_view === "Weekly")
	  	color.domain(d3.keys(data[0]).filter(function(key) { return key !== "Week"; }));
	  else
	  	color.domain(d3.keys(data[0]).filter(function(key) { return key !== "Month" && key !== "Average Daily Hours"; }));
	  data.forEach(function(d) {
	  	var time = null;
	  	if(default_view === "Weekly")
			time = d.Week; //add to stock code
		else
			time = d.Month;
		var y0 = 0;
		//d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
		d.ages = color.domain().map(function(name) { return {time:time, name: name, y0: y0, y1: y0 += +d[name]}; });
		d.total = d.ages[d.ages.length - 1].y1;

	  });
		//time = time

	  //scale the range of the data
	  x.domain(data.map(function(d) { 
	  		if(default_view === "Weekly")
	  			return d.Week; 
	  		else
	  			return d.Month
	  }));
	  y.domain([0, d3.max(data, function(d) { return d.total; })]);

	  //creates x axis
	  svg.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + height + ")")
		  .call(xAxis);
	  
	//Create X axis label   
		svg.append("text")
		.attr("x", width / 2 )
		.attr("y",  height + margin.bottom -10)
		.style("text-anchor", "middle")
		.text(text);

	  svg.append("g")
		  .attr("class", "y axis")
		  .call(yAxis)
		.append("text")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em")
		  .style("text-anchor", "end");

	//Create Y axis label
		svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0-margin.left/2)
		.attr("x",0 - (height / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Percentage of Time");  

		//week = time
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
		  .attr("y", function(d) { 
		  	return y(d.y1); 
		  })
		  .attr("x",function(d) { //add to stock code
			  return x(d.time)
			})
		  .attr("height", function(d) { return y(d.y0) - y(d.y1); })
		  .attr("class", function(d) {
			classLabel = d.name.replace(/\s/g, ''); //remove spaces
			return "class" + classLabel;
		  })
		  .style("fill", function(d) { return color(d.name); });

  		
  	 var columnLabels = {	"s_w_personal_other"	: "Personal/Other",
							"s_w_travel"			: "Travel",
							"s_w_pr_media_analyst"	: "PR Media Analyst",
							"s_w_internal"			: "Internal",
							"s_w_customers_partners": "Customer Partners",
							"s_w_parent"			: "Parent",
							"s_w_old_acquisition"	: "Old Acquisition",
							"s_w_new_acquisition" 	: "New Acquisition",
							"s_w_topicalmtg"		: "Topical Meeting" };		
							
	  week.selectAll("rect")
		   .on("mouseover", function(d){

			  var delta = d.y1 - d.y0;
			  var xPos = parseFloat(d3.select(this).attr("x"));
			  var yPos = parseFloat(d3.select(this).attr("y"));
			  var height = parseFloat(d3.select(this).attr("height"))
			  //var label = columnLabels(d.name);
		  
			  d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);

		
			if(default_view === "Weekly"){
			  svg.append("text")
			  .attr("x",xPos)
			  .attr("y",yPos +height/2)
			  .attr("class","tooltip")
			  .text(columnLabels[d.name] +": "+ delta.toFixed(2)); 
			}else{
			  svg.append("text")
			  .attr("x",xPos)
			  .attr("y",yPos +height/2)
			  .attr("class","tooltip")
			  .text(d.name +": "+ delta.toFixed(2)); 
			}
		  
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
		  .attr("transform", function(d, i) { return "translate(200," + (i * 20) + ")"; }); 
		  //.attr("transform", function(d, i) { return "translate(" + (width - 600) + "," + (margin.top + i) * 20 + ")"; }); 


	  //reverse order to match order in which bars are stacked    
	  legendClassArray = legendClassArray.reverse();
  
	  active_list = [];
	  class_keep = [];  //don't need

	  legend.append("rect")
		  .attr("x", width )
		  .attr("width", 18)
		  .attr("height", 18)
		  .style("fill", color)
		  .attr("id", function (d, i) {
			return "id" + d.replace(/\s/g, '');
		  })
	  
		  .on("click",function(d){        
			//get active link
			active_link = this.id.split("id").pop(); //active link = name of column selected
		
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
		  .attr("x", width - 10)
		  .attr("y", 9)
		  .attr("dy", ".35em")
		  .style("text-anchor", "end")
		  .text(function(d) { 
		  	if(default_view === "Monthly")
		  		return String(d);
		  	else
				return columnLabels[String(d)]; //print legend labels
		  });
  

	  //for all ds, restore    
	  temp = [];
 
	  //only for one d
	  function restorePlot(d) {
		temp =[];
		console.log("restoring");
		console.log(d);
		temp.push(d);
	
		console.log(selected_cols);
		selected_cols.remove(d.id.split("id").pop());
		console.log("SELECTED COLS JUST REMOVED");
		console.log(selected_cols);
	
		last_elem = selected_d_objects.length - 1;
	
		console.log("%%%%%%%%%%selected d objects array");
		console.log(selected_d_objects);
		//push all other cols above deselected one into temp array
		while(selected_d_objects[last_elem] != d){
			if(!temp.includes(selected_d_objects[last_elem])){
				temp.push(selected_d_objects[last_elem]);
			}
			last_elem--;
		}
   
	   console.log("WHATS IN TEMP!!!!!!!!!!!!!!!");
	   console.log(temp);
   
		//erase columns above and including d
		for (i = 0; i < temp.length; i++) {
		  console.log(temp[i].id.split("id").pop());
		  var current_col = temp[i].id.split("id").pop();
		  if(!selected_cols.includes(current_col)){
			  d3.selectAll(".class" + current_col)  
				.transition()
				//.duration(500)
				.style("opacity", 0);
			}
		}
	
		//for each column in temp, get the index, 
		//and subtract height from y list value   
		height_removed = [];
		for (i = 0; i < temp.length; i++) {
			col = temp[i].id.split("id").pop(); //the column name that we selected
			idx = legendClassArray.indexOf(col); 
		
			//update y_new_list
			week.selectAll("rect").forEach(function (d, i) {  
			  //get height and y posn of base bar and selected bar
			  h_keep = d3.select(d[idx]).attr("height");
			  height_removed.push(h_keep);
			  new_y_list[i] =  parseInt(new_y_list[i])+ parseInt(h_keep);     	
			})
			console.log("height removed is");
			console.log(height_removed);
			height_removed = []; //clear for next column name's set of heights
		}
	
		console.log("new_y_list");
		console.log(new_y_list);

		//remove desired column
		selected_d_objects.remove(d);
		temp.remove(d);

		temp.reverse();
		console.log(temp);
	
		console.log("HERE WE START REPLOTTING!!!!!!!");
		//re-plot remaining items in temp
		index = 0;  //reset to zero after each deselection, ie each time this function is called
		if (temp.length > 0){
			setTimeout(replot, 0); //delay by 2 seconds
		}

	
		console.log("END OF METHOD!");
	  }
  
  
	  var index = 0; //for replotting, keeps track of index in temp

	  //plots columns with timeout
	  function replot(){
		if(temp.length == 0)
			return;
	
		console.log("IN REPLOT");
		console.log(temp);
		plotSingle(temp[index++]);
	
		if(index < temp.length){
			setTimeout(replot, 500);  //can keep playing with this number
		}
	  }



	  //dict of all original y positions to help with restoration
	  //key: d, value: y_keep
	/*  y_orig = [];  */
	  new_y_list = []; //array of the next y position to plot single col onto
	  selected_cols = []; 
	  selected_d_objects = [];
	  firstTimePlotting = true; //special case for the first time I ever plot a single column
	  height_added = [];
  
  
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
  
		//if col is not in selected_cols, then add it
		//otherwise, don't do anything
		if (!selected_cols.includes(col)){
			selected_cols.push(col);
		}
	
		console.log("SELECTED COLS INCLUDES");
		console.log(selected_cols);
		console.log(JSON.stringify(legendClassArray));
	
		//erase all but selected bars by setting opacity to 0
		//legendClassArray holds all col names
		for (i = 0; i < legendClassArray.length; i++) {
		  //if not already erased, then erase
		  if (!selected_cols.includes(legendClassArray[i])) {
			d3.selectAll(".class" + legendClassArray[i])
			  .transition()
			  //.duration(1000)          
			  .style("opacity", 0);
		  } else { //previously erased, now unerase

			d3.selectAll(".class" + legendClassArray[i])
			  .transition()
			  //.duration(200)          
			  .style("opacity", 1);
		  }
		}


		//lower the bars to start on x-axis   
		count = 1;
		week.selectAll("rect").forEach(function (d, i) {  
			//get height and y posn of base bar and selected bar
			h_keep = parseInt(d3.select(d[idx]).attr("height"));
			y_keep = d3.select(d[idx]).attr("y");

			//for testing purposes: keep track of height being added
			height_added.push(h_keep);

			//if first time plotting, initialize new_y_list values
			if(firstTimePlotting){
				h_base = parseInt(d3.select(d[0]).attr("height")); //height of rectangle
				y_base = d3.select(d[0]).attr("y");   

				h_shift = h_keep - h_base;
				y_new = y_base - h_shift; //the y-coord we should graph next col from
				
				new_y_list.push(y_new);
				
				/* testing
				console.log(d3.select(d[idx]).attr("height"));
				d3.select(d[idx]).attr("height", h_base + 100);  //idx refers to index of col num
				console.log("AFTER INCREASING HEIGHT OF EACH RECT");
				console.log(d);
				console.log(d3.select(d[idx]).attr("height"));
				*/
				
				
				
				//reposition selected bars
				d3.select(d[idx])
				  .transition()
				  //.duration(500)
				  //.delay(500)
				  .attr("y", y_new);
			}else{
				y_new = new_y_list[i] - h_keep;
				new_y_list[i] = y_new;

				//reposition selected bars
				d3.select(d[idx])
				  .transition()
				  .duration(250)
				  .delay(200)
				  .attr("y", y_new);
			}
			count++;
		})  
	
		firstTimePlotting = false;	
		console.log("height added");
		console.log(height_added);
		height_added = []; //clear for next column name's set of heights 

		console.log("CASE 1: AFTER ADDING COLUMN, WHAT'S THE VALUE INSIDE NEW_Y_LIST?");
		console.log(new_y_list);

 
		if(!selected_d_objects.includes(d)){
			selected_d_objects.push(d);
		}
	
		console.log(selected_d_objects);
		console.log("DONE");
	  } 
  
	});
}//end graphWeekly



function handlePredictions(){
	
	var period_indices = {
		"short": 6,
		"med": 7,
		"long": 8
	}

	for(var i = 1; i <= 24; i++){
		var element = document.getElementById(i.toString());
		var period_col_array = (element.name).split("_");
		var period = period_col_array[0];
		var colName = period_col_array[1];
		var value = element.value;
		
		//add each update to predictions array
		predictions.push({"period": period, "colName": colName, "value": value});

	}
	refreshGraph(default_view);
}


function inputPredictions(data_array){
	var current_data_array = data_array;  //makes copy of data
	
	var period_indices = {
		"short": 6,
		"med": 7,
		"long": 8
	}
	
	//for each item in predictions, set the object's value to the user input's value
	for(var i = 0; i < predictions.length; i++){
		var dict = predictions[i];
		var period = dict["period"];
		var index = period_indices[period]; 
		//returns obj with each col's value given a period
		var period_obj = current_data_array[index];
		
		var colName = dict["colName"];
		var value = dict["value"];
		period_obj[colName] = value;
	}
	
	return current_data_array;
}


function removeGraph(){
	$('#graph').empty();
}

//switches graph from monthly to weekly view and vice versa
function toggleGraph() {
	removeGraph();
	if(default_view === "Monthly"){
		default_view = "Weekly";
		$("#toggle_button").html('See Monthly Graph');
	}else{ 
		default_view = "Monthly";
		$("#toggle_button").html('See Weekly Graph');
	}
	createGraph(default_view);
}


//refreshes the current graph to restore original column order
function refreshGraph(){
	removeGraph();
	//refreshData();
	createGraph(default_view);
}


//handler for Reset Button in form
function reset_input(){
	predictions = [];
	refreshGraph();
}


//Prototype to remove object from array, removes first
//matching object only
Array.prototype.remove = function (v) {
    if (this.indexOf(v) != -1) {
        this.splice(this.indexOf(v), 1);
        return true;
    }
    return false;
}


//execute the following function when the page loads:
createGraph(default_view);