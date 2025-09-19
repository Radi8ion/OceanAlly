import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as d3 from 'd3';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  Zap,
  Waves,
  Wind,
  Thermometer,
  RefreshCw,
  Eye,
  Shield
} from "lucide-react";

const Analysis = () => {
  // Refs for D3 visualizations
  const severityChartRef = useRef(null);
  const hazardTypeChartRef = useRef(null);
  const timelineChartRef = useRef(null);
  const heatmapRef = useRef(null);
  const gaugeChartRef = useRef(null);

  // State for data and loading
  const [stats, setStats] = useState({
    totalReports: 1247,
    activeHazards: 23,
    communityMembers: 5892,
    responseRate: "94%"
  });

  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("severity");
  const [loading, setLoading] = useState(false);

  // Generate dummy data
  const generateDummyData = () => {
    const severityData = [
      { severity: 'Low', count: 45, color: '#10b981' },
      { severity: 'Medium', count: 32, color: '#f59e0b' },
      { severity: 'High', count: 18, color: '#f97316' },
      { severity: 'Critical', count: 8, color: '#ef4444' }
    ];

    const hazardTypes = [
      { type: 'Tsunami', count: 28, icon: '🌊' },
      { type: 'Cyclone', count: 22, icon: '🌪️' },
      { type: 'Pollution', count: 19, icon: '☣️' },
      { type: 'Algae Bloom', count: 15, icon: '🦠' },
      { type: 'Debris', count: 12, icon: '🗑️' },
      { type: 'Lightning', count: 7, icon: '⚡' }
    ];

    const timelineData = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      timelineData.push({
        date,
        reports: Math.floor(Math.random() * 15) + 2,
        severity: Math.random() * 10 + 1
      });
    }

    const hotspots = [
      { id: 1, name: "Bay Area Alpha", lat: 37.7749, lng: -122.4194, intensity: 8.5, reports: 15 },
      { id: 2, name: "Coastal Zone Beta", lat: 36.7783, lng: -119.4179, intensity: 7.2, reports: 12 },
      { id: 3, name: "Marine Sector Gamma", lat: 34.0522, lng: -118.2437, intensity: 6.8, reports: 9 },
      { id: 4, name: "Ocean Point Delta", lat: 32.7157, lng: -117.1611, intensity: 5.9, reports: 7 },
      { id: 5, name: "Harbor Zone Epsilon", lat: 37.8044, lng: -122.2712, intensity: 5.3, reports: 5 }
    ];

    return { severityData, hazardTypes, timelineData, hotspots };
  };

  const { severityData, hazardTypes, timelineData, hotspots } = generateDummyData();

  // Enhanced Severity Distribution with animations
  useEffect(() => {
    if (!severityChartRef.current) return;

    const svg = d3.select(severityChartRef.current);
    svg.selectAll("*").remove();

    const width = 320;
    const height = 320;
    const radius = Math.min(width, height) / 2 - 20;

    const color = d3.scaleOrdinal()
      .domain(severityData.map(d => d.severity))
      .range(severityData.map(d => d.color));

    const pie = d3.pie()
      .value(d => d.count)
      .sort(null)
      .padAngle(0.02);

    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const outerArc = d3.arc()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.2);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2}, ${height/2})`);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const arcs = g.selectAll('.arc')
      .data(pie(severityData))
      .enter().append('g')
      .attr('class', 'arc');

    // Add paths with animation
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.severity))
      .style('opacity', 0.9)
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))')
      .transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      })
      .end()
      .then(() => {
        // Add interactivity after animation
        arcs.selectAll('path')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 1)
              .attr('transform', 'scale(1.05)');
            
            tooltip
              .style('opacity', 1)
              .html(`<strong>${d.data.severity}</strong><br/>Count: ${d.data.count}<br/>Percentage: ${((d.data.count / d3.sum(severityData, d => d.count)) * 100).toFixed(1)}%`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 0.9)
              .attr('transform', 'scale(1)');
            
            tooltip.style('opacity', 0);
          });
      });

    // Add center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text(d3.sum(severityData, d => d.count));

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Total Reports');

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [severityData]);

  // Enhanced Hazard Types Bar Chart
  useEffect(() => {
    if (!hazardTypeChartRef.current) return;

    const svg = d3.select(hazardTypeChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 450 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .range([0, width])
      .domain(hazardTypes.map(d => d.type))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(hazardTypes, d => d.count)])
      .range([height, 0]);

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      .domain([0, hazardTypes.length - 1]);

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add gradient definitions
    const defs = g.append('defs');
    hazardTypes.forEach((d, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', height)
        .attr('x2', 0).attr('y2', 0);
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(i))
        .attr('stop-opacity', 0.8);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(i))
        .attr('stop-opacity', 1);
    });

    // Add bars with animation
    g.selectAll('.bar')
      .data(hazardTypes)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.type))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', (d, i) => `url(#gradient-${i})`)
      .style('rx', 4)
      .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))')
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count))
      .end()
      .then(() => {
        // Add interactivity
        g.selectAll('.bar')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 0.8)
              .attr('transform', 'scale(1.02)');
            
            tooltip
              .style('opacity', 1)
              .html(`<strong>${d.icon} ${d.type}</strong><br/>Reports: ${d.count}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 1)
              .attr('transform', 'scale(1)');
            
            tooltip.style('opacity', 0);
          });
      });

    // Add x axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#374151')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#374151');

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [hazardTypes]);

  // Enhanced Timeline Chart
  useEffect(() => {
    if (!timelineChartRef.current) return;

    const svg = d3.select(timelineChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const x = d3.scaleTime()
      .domain(d3.extent(timelineData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(timelineData, d => d.reports)])
      .range([height, 0]);

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.reports))
      .curve(d3.curveCardinal);

    const area = d3.area()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.reports))
      .curve(d3.curveCardinal);

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add gradient
    const defs = g.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.1);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.4);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add area with animation
    const path = g.append('path')
      .datum(timelineData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0);

    // Add line
    g.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))')
      .attr('d', line);

    // Add interactive dots
    g.selectAll('.dot')
      .data(timelineData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.reports))
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr('r', 4)
      .end()
      .then(() => {
        g.selectAll('.dot')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6);
            
            tooltip
              .style('opacity', 1)
              .html(`<strong>Date:</strong> ${d.date.toLocaleDateString()}<br/><strong>Reports:</strong> ${d.reports}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 4);
            
            tooltip.style('opacity', 0);
          });
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%m/%d')))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#374151');

    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#374151');

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [timelineData]);

  // Risk Gauge Chart
  useEffect(() => {
    if (!gaugeChartRef.current) return;

    const svg = d3.select(gaugeChartRef.current);
    svg.selectAll("*").remove();

    const width = 200;
    const height = 150;
    const radius = Math.min(width, height) / 2 - 10;

    const riskLevel = 73; // Current risk level percentage
    
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2}, ${height - 20})`);

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .cornerRadius(5);

    // Background arc
    g.append('path')
      .attr('d', arc.endAngle(Math.PI / 2)())
      .attr('fill', '#e5e7eb')
      .style('opacity', 0.3);

    // Animated progress arc
    const progressArc = g.append('path')
      .attr('fill', riskLevel > 70 ? '#ef4444' : riskLevel > 40 ? '#f59e0b' : '#10b981')
      .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');

    // Animate the gauge
    progressArc
      .transition()
      .duration(2000)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(0, (riskLevel / 100) * Math.PI);
        return function(t) {
          return arc.endAngle(-Math.PI / 2 + interpolate(t))();
        };
      });

    // Add center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-10px')
      .style('font-size', '28px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('0')
      .transition()
      .duration(2000)
      .tween('text', function() {
        const interpolate = d3.interpolate(0, riskLevel);
        return function(t) {
          this.textContent = Math.round(interpolate(t));
        };
      });

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '10px')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Risk Level');

  }, []);

  // Heatmap for geographic distribution
  useEffect(() => {
    if (!heatmapRef.current) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 200;
    
    // Create a simple grid heatmap
    const gridData = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 6; j++) {
        gridData.push({
          x: i,
          y: j,
          value: Math.random() * 10
        });
      }
    }

    const cellSize = 25;
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateReds)
      .domain([0, 10]);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(20, 20)');

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add cells
    g.selectAll('.cell')
      .data(gridData)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => d.x * cellSize)
      .attr('y', d => d.y * cellSize)
      .attr('width', cellSize - 1)
      .attr('height', cellSize - 1)
      .attr('fill', '#e5e7eb')
      .style('rx', 2)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 20)
      .attr('fill', d => colorScale(d.value))
      .end()
      .then(() => {
        g.selectAll('.cell')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('stroke', '#374151')
              .style('stroke-width', 2);
            
            tooltip
              .style('opacity', 1)
              .html(`Intensity: ${d.value.toFixed(1)}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .style('stroke', 'none');
            
            tooltip.style('opacity', 0);
          });
      });

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        totalReports: prev.totalReports + Math.floor(Math.random() * 50),
        activeHazards: Math.floor(Math.random() * 30) + 10,
        responseRate: `${Math.floor(Math.random() * 10) + 90}%`
      }));
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Marine Analysis Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Real-time insights and comprehensive analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white/70 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={refreshData} 
                disabled={loading}
                className="bg-white/70 hover:bg-white/90 backdrop-blur-sm text-gray-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Reports", value: stats.totalReports, icon: BarChart3, color: "blue", change: "+12%" },
              { title: "Active Hazards", value: stats.activeHazards, icon: AlertTriangle, color: "red", change: "-5%" },
              { title: "Community Members", value: stats.communityMembers, icon: Users, color: "green", change: "+8%" },
              { title: "Response Rate", value: stats.responseRate, icon: Activity, color: "purple", change: "+2%" }
            ].map((stat, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change} from last period
                      </p>
                    </div>
                    <div className={`w-14 h-14 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                      <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span>Risk Severity Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <svg ref={severityChartRef}></svg>
              </CardContent>
            </Card>

            {/* Hazard Types */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span>Hazard Type Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <svg ref={hazardTypeChartRef}></svg>
              </CardContent>
            </Card>
          </div>

          {/* Timeline and Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span>Reports Timeline Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <svg ref={timelineChartRef}></svg>
              </CardContent>
            </Card>

            {/* Risk Gauge */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <span>Overall Risk Level</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <svg ref={gaugeChartRef}></svg>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Heatmap */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>Geographic Heat Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <svg ref={heatmapRef}></svg>
              </CardContent>
            </Card>

            {/* Enhanced Hotspots */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <span>Critical Hotspots</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotspots.map((hotspot, index) => (
                    <div 
                      key={hotspot.id} 
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          hotspot.intensity > 7 ? 'bg-red-100 group-hover:bg-red-200' : 
                          hotspot.intensity > 5 ? 'bg-yellow-100 group-hover:bg-yellow-200' : 
                          'bg-green-100 group-hover:bg-green-200'
                        }`}>
                          <MapPin className={`w-5 h-5 ${
                            hotspot.intensity > 7 ? 'text-red-600' : 
                            hotspot.intensity > 5 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{hotspot.name}</p>
                          <p className="text-sm text-gray-600">{hotspot.reports} reports</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          hotspot.intensity > 7 ? 'bg-red-100 text-red-800' : 
                          hotspot.intensity > 5 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {hotspot.intensity.toFixed(1)} Risk
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {hotspot.lat.toFixed(3)}, {hotspot.lng.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Additional Stats */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-red-600">5</p>
                      <p className="text-xs text-gray-600">High Risk</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">12</p>
                      <p className="text-xs text-gray-600">Medium Risk</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">23</p>
                      <p className="text-xs text-gray-600">Low Risk</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Updates Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Live Monitoring Active</h3>
                  <p className="text-blue-100">Real-time data updates every 30 seconds</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;