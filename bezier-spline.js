/* bezier-spline.js
 *
 * computes cubic bezier coefficients to generate a smooth
 * line through specified points. couples with SVG graphics
 * for interactive processing.
 *
 * For more info see:
 * http://www.particleincell.com/2012/bezier-splines/
 *
 * Lubos Brieda, Particle In Cell Consulting LLC, 2012
 * you may freely use this algorithm in your codes however where feasible
 * please include a link/reference to the source article
 */

/*saves elements as global variables*/
function getBezierPoints(points, isClosed)
{
    if(points.length == 1)
        return points;
    var x = new Array();
    var y = new Array();
    for(var i=0;i<points.length;++i)
    {
        x[i] = points[i].x;
        y[i] = points[i].y;
    }
    var count = 0;
    if(isClosed)
    {
        var size = points.length;
        for(var i=0;i<size && i<4;i++)
        {
            x[size+i] = points[i].x;
            y[size+i] = points[i].y;
            count++;
        }


    }

    var result = updateSplines(x, y);
    var len = result.length;
    return isClosed?result.slice(3, len-(count-2)*3):result;
}
	
/*computes spline control points*/
function updateSplines(x, y)
{
    var size = x.length;
    var bezierPoints = new Array();
    if(size == 2)
    {
        bezierPoints.push(new Point(x[0],y[0]));
        bezierPoints.push(new Point(x[0],y[0]));
        bezierPoints.push(new Point(x[1],y[1]));
        bezierPoints.push(new Point(x[1],y[1]));
        return bezierPoints;
    }


	/*computes control points p1 and p2 for x and y direction*/
    var px = computeControlPoints(x);
    var py = computeControlPoints(y);
	
	/*updates path settings, the browser will draw the new spline*/
    //path(x[i],y[i],px.p1[i],py.p1[i],px.p2[i],py.p2[i],x[i+1],y[i+1]));
    bezierPoints.push(new Point(x[0], y[0]));
    for (var i=0;i<size-1;i++)
    {
        bezierPoints.push(new Point(px.p1[i],py.p1[i]));
        bezierPoints.push(new Point(px.p2[i],py.p2[i]));
        bezierPoints.push(new Point(x[i+1],y[i+1]));
    }
    return bezierPoints;
}

/*computes control points given knots K, this is the brain of the operation*/
function computeControlPoints(K)
{
	p1=new Array();
	p2=new Array();
	n = K.length-1;
	
	/*rhs vector*/
	a=new Array();
	b=new Array();
	c=new Array();
	r=new Array();
	
	/*left most segment*/
    a[0]=0;
    b[0]=2;
    c[0]=1;
    r[0] = K[0]+2*K[1];

	/*internal segments*/
	for (i = 1; i < n - 1; i++)
	{
		a[i]=1;
		b[i]=4;
		c[i]=1;
		r[i] = 4 * K[i] + 2 * K[i+1];
	}
			
	/*right segment*/
    a[n-1]=2;
    b[n-1]=7;
    c[n-1]=0;
    r[n-1] = 8*K[n-1]+K[n];
	
	/*solves Ax=b with the Thomas algorithm (from Wikipedia)*/
	for (i = 1; i < n; i++)
	{
		m = a[i]/b[i-1];
		b[i] = b[i] - m * c[i - 1];
		r[i] = r[i] - m*r[i-1];
	}
 
	p1[n-1] = r[n-1]/b[n-1];
	for (i = n - 2; i >= 0; --i)
		p1[i] = (r[i] - c[i] * p1[i+1]) / b[i];
		
	/*we have p1, now compute p2*/
	for (i=0;i<n-1;i++)
		p2[i]=2*K[i+1]-p1[i+1];
	
	p2[n-1]=0.5*(K[n]+p1[n-1]);
	
	return {p1:p1, p2:p2};
}

