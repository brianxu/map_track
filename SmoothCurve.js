function Point(x, y) {
    this.x = x;
    this.y = y;
    this.norm = function() { return Math.sqrt(this.x*this.x+this.y*this.y);}
    this.plus = function(p) { return new Point(this.x+p.x, this.y+p.y);}
    this.minus = function(p) { return new Point(this.x-p.x, this.y-p.y);}
    this.is_zero = function() { return this.x == 0 && this.y == 0;}
    this.neg = function() {return new Point(-this.x, -this.y);}
    this.equal = function(p){return this.x == p.x && this.y == p.y;}
    this.time = function(a){return new Point(this.x*a, this.y*a);}
    this.normalize = function(){var normV = this.norm();this.x /= normV; this.y /= normV;}
    this.copy = function(){return new Point(this.x, this.y);}
    this.set = function(p){this.x == p.x;this.y == p.y;}
}
function getControlPoints(x0,y0,x1,y1,x2,y2,t){
    var d01=Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
    var d12=Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
    var fa=t*d01/(d01+d12);   // scaling factor for triangle Ta
    var fb=t*d12/(d01+d12);   // ditto for Tb, simplifies to fb=t-fa
    var p1x=x1-fa*(x2-x0);    // x2-x0 is the width of triangle T
    var p1y=y1-fa*(y2-y0);    // y2-y0 is the height of T
    var p2x=x1+fb*(x2-x0);
    var p2y=y1+fb*(y2-y0);
    return [p1x,p1y,p2x,p2y];
}

function getBezierTans(p0,p1,p2,t){
    var d01=Math.sqrt(Math.pow(p1.x-p0.x,2)+Math.pow(p1.y-p0.y,2));
    var d12=Math.sqrt(Math.pow(p2.x-p1.x,2)+Math.pow(p2.y-p1.y,2));
    var fa=t*d01/(d01+d12);   // scaling factor for triangle Ta
    var fb=t*d12/(d01+d12);   // ditto for Tb, simplifies to fb=t-fa
    var p1x=p1.x-fa*(p2.x-p0.x);    // x2-x0 is the width of triangle T
    var p1y=p1.y-fa*(p2.y-p0.y);    // y2-y0 is the height of T
    var p2x=p1.x+fb*(p2.x-p0.x);
    var p2y=p1.y+fb*(p2.y-p0.y);

    var tans = new Array();
    tans[0] = {x:p1x, y:p1y};
    tans[1] = {x:p2x, y:p2y};
    return tans;
}

function getControlPoints2(points, isClosed, t){
    var bezierPoints = new Array();
    var tanslist = new Array();
    for(var i = 0; i < points.length; ++i)
    {
        var p0 = {x:points[(i-1+points.length)%points.length].x, y:points[(i-1+points.length)%points.length].y};
        var p1 = {x:points[i%points.length].x, y:points[i%points.length].y};
        var p2 = {x:points[(i+1)%points.length].x,y:points[(i+1)%points.length].y};
        if(!isClosed && i == 0)
        {
            p0 = {x:points[i%points.length].x, y:points[i%points.length].y};
        }
        if(!isClosed && i == (points.length-1) )
        {
            p2 = {x:points[i%points.length].x, y:points[i%points.length].y};
        }

        var tans = getBezierTans(p0, p1, p2, t);
        tanslist.push(tans[0]);
        tanslist.push(tans[1]);
    }
    var temp = points.slice(0);
    bezierPoints.push(temp[0]);
    for(var i = 0; i < temp.length-1; ++i)
    {
        //segment between i and i+1
        bezierPoints.push(tanslist[i*2+1]);
        bezierPoints.push(tanslist[(i+1)*2]);
        bezierPoints.push(temp[i+1]);
    }
    if(isClosed)
    {
        bezierPoints.push(tanslist[(temp.length-1)*2+1]);
        bezierPoints.push(tanslist[0]);
        bezierPoints.push(temp[0]);
    }

    return bezierPoints;
}

function compute_Bezier(t, P0, P1, P2, P3)
{
    //Bezier
    P0 = new Point(P0.x, P0.y);
    P1 = new Point(P1.x, P1.y);
    P2 = new Point(P2.x, P2.y);
    P3 = new Point(P3.x, P3.y);


    var c = P1.minus(P0).time(3.0);
    var b = P2.minus(P1).time(3.0).minus(c);
    var a = P3.minus(P0).minus(c).minus(b);

    return a.time(t*t*t).plus(b.time(t*t)).plus(c.time(t).plus(P0));

}


function getPolylines(bezierPoints, sampleRate)
{
    var polyPoints = new Array();
    polyPoints.push(new Point(bezierPoints[0].x, bezierPoints[0].y));
    for(var i = 0; i < bezierPoints.length-1; i+=3)
    {
        var step_size = 1.0/sampleRate;
        for(var t = step_size; t < 1-step_size; t+=step_size)
        {
            var newP = compute_Bezier(t, bezierPoints[i],bezierPoints[i+1],bezierPoints[i+2],bezierPoints[i+3]);
            polyPoints.push(newP);
        }
        polyPoints.push(new Point(bezierPoints[i+3].x, bezierPoints[i+3].y));
    }

    return polyPoints;
}
