/*
Grace Hu
March 25, 2017
caseViz.js

This file is responsible for all D3 interactions and animations. 
It generates:
	1. Monthly visualization of the data and corresponding stacked chart animations.
	2. Weekly visualization of the data and corresponding stacked chart animations.
	3. Clickable and adjustable bars in the Short, Medium, and Long term sections.
	4. When clicked, adjustable bars have corresponding sliders to help adjust values

Useful resources:
http://bl.ocks.org/katirg/5f168b5c884b1f9c36a5
http://bl.ocks.org/yuuniverse4444/8325617
*/

//global variables
var default_view = "Monthly";
var data = null; 		//before loading in data
var predictions = []; 	//array of user input predictions 
var isPredictionsArrayModifed = false;
var previouslyClickedItem = null;  //holds the item that was previously clicked/outlined
var columnLabels = {		"s_w_personal_other"	: "On Personal Activities",
							"s_w_travel"			: "On Travel",
							"s_w_pr_media_analyst"	: "With PR and Media and Analysts",
							"s_w_internal"			: "In Internal Meetings",
							"s_w_customers_partners": "With Customers and Partners",
							"s_w_emc_federation"	: "With Board including parent company",
							"s_w_board_airwatch"	: "With Airwatch Board",
							"s_w_csb_virtustream" 	: "Discussing new strategic acquisition" };		

var periodArray = ["Short Run", "Medium Run","Long Run"];
var periodColorArray = ["#17becf", "#d6616b", "#74c476"]; //short, medium, long run colors

var colArray = ["On Personal Activities",
				"On Travel",
				"With PR and Media and Analysts",
				"In Internal Meetings",
				"With Customers and Partners",
				"With Board including parent company",
				"With Airwatch Board",
				"Discussing new strategic acquisition" ];	

//for colors corresponding to the columns
var colorArray = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", 
							"#d0743c", "#ff8c00", "#990000", "#CD5C5C"];


//creates the main visualization graph								
function createGraph(view_type){
	var fileName = null;
	var text = null;  //for x-axis label
	
	if(default_view === "Monthly"){
		fileName = "hbs_monthly.csv";
		text = "Month of 2015";
	}else{
		fileName = "HBS_weekly_data_may.csv";
		text = "Week of 2015"
	}
	
	var margin = {top: 20, right: 80, bottom: 60, left: 100},
		width = 860 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
		.rangeRound([height, 0]);

	var color = d3.scale.ordinal()
		.range(colorArray);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickFormat(d3.format(".2s"));
	

	var svg = d3.select("#graph").append("svg")
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
		if(isPredictionsArrayModifed)
			data = useModifiedData(data);
		else
			data = data;
	
		if(default_view === "Weekly")
			color.domain(d3.keys(data[0]).filter(function(key) { 
				return key !== "Week"; 
			}));
		else
			color.domain(d3.keys(data[0]).filter(function(key) { 
				return key !== "Month" && key !== "Average Daily Hours"; 
			}));

	  	data.forEach(function(d) {
			var time = null;
			if(default_view === "Weekly")
				time = d.Week; //add to stock code
			else
				time = d.Month;
			var y0 = 0;
			d.ages = color.domain().map(function(name) { 
				return {
					time:time, 
					name: name, 
					y0: y0, 
					y1: y0 += +d[name]
				}; 
			});
			d.total = d.ages[d.ages.length - 1].y1;
	  	});

		//scale the range of the data
		x.domain(data.map(function(d) { 
			if(default_view === "Weekly")
				return d.Week; 
			else
				return d.Month
		}));
	  	
	  	y.domain([0, d3.max(data, function(d) { return d.total; })]);

		//create x axis
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
	
		//initialize tooltip 
		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-3, 0])
			.html(function(d) {
				var delta = d.y1 - d.y0; //percentage of each section
				var text = "none";
		
				//get corresponding col label
				if(default_view === "Weekly")
					text = columnLabels[d.name]; 
				else
					text = d.name;

				//renders tooltip in html	
				return "<strong>" + text + ":</strong> <span style='color:gold'> " + delta.toFixed(2) + "%</span>";
		});
	  

		svg.call(tip); //invoke tooltip
		
		//actions and attributes that apply to all sections within each column
		//week refers to all columns of data
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
			.style("fill", function(d) { return color(d.name); })	
			.attr("stroke", function(d) { 
				//make the previously clicked box outlined even after graph updates
				//if prev clicked item matches something in d, then return black 
				if(previouslyClickedItem != null 
						&& previouslyClickedItem.time == d.time 
						&& previouslyClickedItem.name == d.name){  		
					var index = periodArray.indexOf(d.time);
					var color = periodColorArray[index];
					return color;
		  		}
		  	})
		  	.attr("stroke-width", function(d){
		  		//make the previously clicked box outlined even after graph updates
		  		//if prev clicked item matches something in d, then return black
		  		if(previouslyClickedItem != null 
		  		&& previouslyClickedItem.time == d.time 
		  		&& previouslyClickedItem.name == d.name){  
		  			return 5;
		  		}
		 	 })
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide)
			.on("click", function(d){ //click handler for each section of column
				//if something else is already outlined, clear that outline			
				if (previouslyClickedItem != d){
					
					//remove the previously clicked box outline	
					week.selectAll("rect")
					.attr("stroke", function(d) { 
						//if prev clicked item matches something in d, then return black		
						if(previouslyClickedItem != null 
							&& previouslyClickedItem.time == d.time 
							&& previouslyClickedItem.name == d.name){  
							return null;			
						}
					})
					.attr("stroke-width", function(d){
						//remove the previously clicked box outline	
						//if prev clicked item matches something in d, then return black
						if(previouslyClickedItem != null 
						&& previouslyClickedItem.time == d.time 
						&& previouslyClickedItem.name == d.name){  
							return null;
						}
					})			
				} //end if
				
				previouslyClickedItem = d;
			
				//if time is short med or long
				if(d.time === "Short Run" || d.time === "Medium Run" || d.time === "Long Run" ){
					var height = d.y1 - d.y0;
								
					//draw outline if box is clicked with color corresponding to period
					var periodIndex = periodArray.indexOf(d.time);
					var periodColor = periodColorArray[periodIndex];
					console.log(periodColor);
					
					d3.select(this)
					.attr("stroke", periodColor)
					.attr("stroke-width", 5);
							
					//use slider to modify the input
					//try to reference the y1/modify that
					addSlider(d.time, d.name, height);
				}else{
					hideSlider(); //remove the slider
				}
			}); //end click handler


		/* creates and handles legend interactions */
		var legend = svg.selectAll(".legend")
			.data(color.domain().slice().reverse())
			.enter().append("g")
			.attr("class", function (d) {
				legendClassArray.push(d.replace(/\s/g, '')); //remove spaces
				return "legend";
			})
			.attr("transform", function(d, i) { return "translate(250," + (i * 20) + ")"; }); 

		//reverse order to match order in which bars are stacked    
		legendClassArray = legendClassArray.reverse();
  
	  	active_list = [];

		legend.append("rect") //create rectangles for legend
			.attr("x", width )
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", color)
			.attr("id", function (d, i) {
				return "id" + d.replace(/\s/g, '');
			})
		.on("click",function(d){   //click handler for legend  
			//get active link, which is name of column selected
			active_link = this.id.split("id").pop(); 

			//if active link is in active_list, remove it
			//else add it to active list, and plotSingle
			if (active_list.includes(active_link)){ 
				active_list.remove(active_link);
				d3.select(this).style("stroke", "none");
			  	restorePlot(this);
			}else{ 
				active_list.push(active_link);
				d3.select(this)  //draw black outline
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



		var sum = 0; //sums up the percentage heights of each bar to display
		var periods_to_display = null;
		
		//label each bar with percentage total
		week.selectAll("text.week")
			.data(function(d) {
				return d.ages; 
			})
		.enter().append("text")
			.attr("class", function(d) {
				classLabel = d.name.replace(/\s/g, ''); //remove spaces
				return "class" + classLabel;
			})
			.attr("x",function(d) { //add to stock code
			  	return x(d.time) + x.rangeBand()/2;
			})
			.attr("y", function(d) {		   
				return -25; 
			})
			.attr("dy", "1.35em")
			.attr('style', 'font-size:13px')
			.text(function(d) { 		
				//only print totals of relevant columns	
				if(d.name != "Discussing new strategic acquisition" || d.time == ""){
					sum = 0; 
					return "";
				}else{
					sum = d.y1; 	
				
					if(sum != 100 && periodArray.indexOf(d.time) > -1){
						if(periods_to_display != null)
							periods_to_display += ", " + d.time;
						else
							periods_to_display = d.time;
						
						var displayText = periods_to_display + " predictions must add to 100%. Continue modifying stacked bars.";				
					
						$("#not100error")
							.text(displayText)
							.css("color", "red");
						console.log(sum);
					}
					return sum.toFixed(1);
				}
			})
		  	.style({ "fill": "blue", "text-anchor": "middle"})
		  

		//for all ds, restore    
		temp = []; 
 
 
		//only for one d
		function restorePlot(d) {
			temp =[d];
			//remove selected col
			selected_cols.remove(d.id.split("id").pop());
		
			last_elem = selected_d_objects.length - 1;
	
			//push all other cols above deselected one into temp array
			while(selected_d_objects[last_elem] != d){
				if(!temp.includes(selected_d_objects[last_elem])){
					temp.push(selected_d_objects[last_elem]);
				}
				last_elem--;
			}
   
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
			for (i = 0; i < temp.length; i++) {
				col = temp[i].id.split("id").pop(); //the column name that we selected
				idx = legendClassArray.indexOf(col); 
		
				//update y_new_list
				week.selectAll("rect").forEach(function (d, i) {  
				  //get height and y posn of base bar and selected bar
				  h_keep = d3.select(d[idx]).attr("height");
				  new_y_list[i] =  parseInt(new_y_list[i])+ parseInt(h_keep);     	
				})
			}
	
			//remove desired column
			selected_d_objects.remove(d);
			temp.remove(d);
			temp.reverse();

			//re-plot remaining items in temp
			index = 0;  //reset to zero after each deselection, ie each time this function is called
			if (temp.length > 0)
				setTimeout(replot, 0); //delay by 2 seconds	
		} //end restorePlot()
  
  	  
	  	var index = 0; //for replotting, keeps track of index in temp


	  	//plots columns with timeout - necessary for animation
	  	function replot(){
			if(temp.length == 0)
				return;
	
			plotSingle(temp[index++]);
	
			if(index < temp.length)
				setTimeout(replot, 500);  //can keep playing with this number	
		}


		new_y_list = []; //array of the next y position to plot single col onto
		selected_cols = []; 
		selected_d_objects = [];
		firstTimePlotting = true; //special case for the first time I ever plot a single column


  		//plotting a single column at a time, where column is one of the legend options
  		//facilitates with graphing one legend selection at a time for all weeks/months
	  	function plotSingle(d) {
			col = d.id.split("id").pop(); //the column name that we selected
			idx = legendClassArray.indexOf(col); 
  
			//if col is not in selected_cols, then add it. Otherwise, do nothing.
			if (!selected_cols.includes(col))
				selected_cols.push(col);

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
			week.selectAll("rect").forEach(function (d, i) {  
				//get height and y posn of base bar and selected bar
				h_keep = parseInt(d3.select(d[idx]).attr("height"));
				y_keep = d3.select(d[idx]).attr("y");

				//if first time plotting, initialize new_y_list values
				if(firstTimePlotting){
					h_base = parseInt(d3.select(d[0]).attr("height")); //height of rectangle
					y_base = d3.select(d[0]).attr("y");   

					h_shift = h_keep - h_base;
					y_new = y_base - h_shift; //the y-coord we should graph next col from
				
					new_y_list.push(y_new);
			
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
			}) //end week.selectAll handler  
	
			firstTimePlotting = false;	

			if(!selected_d_objects.includes(d))
				selected_d_objects.push(d);
			
	  	}  //end plotSingle()
	});  //end D3 CSV handler
}//end createGraph()


//initializes predictions array 
//each element of predictions is a dict with keys period, colName, and value
function initializePredictionsArray(){
							
	for(var i = 0; i < periodArray.length; i++){
		for(var j = 0; j < colArray.length; j++){
			predictions.push({	"period": periodArray[i], 
								"colName": colArray[j],
								"value": 12.5
							 });
							 
		}
	}
}


//any updates to predictions array is done here
function updatePredictionsArray(period, col, value){
	for(var i = 0; i < predictions.length; i++){
		var tempDict = predictions[i];
		if (tempDict["period"] === period && tempDict["colName"] === col)
			tempDict["value"] = value;
	}
	isPredictionsArrayModifed = true;
	
	updateGraph(default_view);
} 


//updates data with user input from slider, aka data that gets changed in predictions
function useModifiedData( data_array){
	var current_data_array = data_array;  //makes copy of data
	
	var period_indices = {
		"Short Run": 6,
		"Medium Run": 7,
		"Long Run": 8
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


//hides the Short, Med, Long x-axis labels.
function hideMarkers(){
	document.getElementById("shortMarker").style.visibility = "hidden";
	document.getElementById("mediumMarker").style.visibility = "hidden";
	document.getElementById("longMarker").style.visibility = "hidden";
	document.getElementById("instructions").style.visibility = "hidden";
}


//show the short, med, long x-axis labels
function showMarkers(){
	document.getElementById("shortMarker").style.visibility = "visible";
	document.getElementById("mediumMarker").style.visibility = "visible";
	document.getElementById("longMarker").style.visibility = "visible";
	document.getElementById("instructions").style.visibility = "visible";
}


//switches graph from monthly to weekly view and vice versa
function toggleGraph() {
	removeGraph();
	if(default_view === "Monthly"){
		default_view = "Weekly";
		$("#toggle_button").html('See Monthly Graph');
		hideMarkers();
	}else{ 
		default_view = "Monthly";
		$("#toggle_button").html('See Weekly Graph');
		showMarkers();
	}
	hideSlider();
	createGraph(default_view);
}


//refreshes the current graph to restore original column order
function updateGraph(){
	//console.log("refresh graph");
	removeGraph();
	//remove any outdated error message
	$("#not100error").empty();
	
	createGraph(default_view);
}


function refreshGraph(){
	isPredictionsArrayModifed = false;
	updateGraph(default_view);
	hideSlider();
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


//adds slider to html file
function addSlider(period, col, currentValue) {
	//to refresh slider, need to remove then redraw
	refreshSlider();
	showSlider();
		
	//eventually read in default from clicked box
	var sliderValue = currentValue; 
	console.log(sliderValue);
	$("#slider_value").text(sliderValue + "%");
	$("#slider_column_text").text(col);
	$("#slider_period_text").text(period);
	
	//style background color for text box by sliders
	styleColumnTextBox(col);
	stylePeriodTextBox(period);

	var slider_details = d3.slider()
							.value(sliderValue)
							.orientation("vertical")
							.axis(true)
							.min(0)
							.max(100)
							.step(1)
							.on("slide", function(event, value) {
								//console.log(event);
								sliderValue = value;
								d3.select('#slider_value').text(sliderValue + "%");
								updatePredictionsArray(period, col, sliderValue);
							});

	d3.select('#d3slider').call(slider_details);
}
 
 
//style background color for column text box by sliders
function styleColumnTextBox(colName){
	var col_index = colArray.indexOf(colName);
	var color = colorArray[col_index];

	$("#slider_column").css({
		"background-color": color,
		"border": "2px solid #a1a1a1",
		"border-radius": "5px"
	});
}

//style background color for period text box by sliders
function stylePeriodTextBox(period){
	var col_index = periodArray.indexOf(period);
	var color = periodColorArray[col_index];
	
	$("#slider_period").css({
		"background-color": color,
		"border": "2px solid #a1a1a1",
		"border-radius": "5px"
	});
}

//removes slider from the page
function refreshSlider(){
	$('#d3slider').empty();
	$('#slider_value').empty();
}


function hideSlider(){
	document.getElementById("slider_wrapper").style.visibility = "hidden";
}	


function showSlider(){
	document.getElementById("slider_wrapper").style.visibility = "visible";
}


//print predictions array 
//TO DO: create option to download predictions from csv
function getPredictions(){
	console.log(predictions);
}


//execute the following function when the page loads:
initializePredictionsArray();
createGraph(default_view);
