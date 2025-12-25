(function (cjs, an) {

    var p; // shortcut to reference prototypes
    var lib={};var ss={};var img={};
    lib.ssMetadata = [
            {name:"toolbar_atlas_", frames: [[0,0,1900,1898]]},
            {name:"toolbar_atlas_2", frames: [[297,1362,225,315],[724,1626,295,21],[297,1002,535,179],[297,1183,533,177],[524,1626,198,56],[0,1002,295,377],[524,1585,316,39],[740,1362,88,79],[740,1443,58,39],[138,1548,99,136],[524,1362,214,221],[0,1549,94,101],[138,1381,133,165],[1002,0,13,22],[0,0,1000,1000],[834,1002,146,314],[0,1381,136,166],[982,1002,32,32],[832,1318,174,246]]}
    ];
    
    
    // symbols:
    
    
    
    (lib._6624937 = function() {
        this.initialize(ss["toolbar_atlas_"]);
        this.gotoAndStop(0);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.BeakerOfWater = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(0);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.Bitmap11 = function() {
        this.initialize(img.Bitmap11);
    }).prototype = p = new cjs.Bitmap();
    p.nominalBounds = new cjs.Rectangle(0,0,5747,3831);
    
    
    (lib.burette = function() {
        this.initialize(img.burette);
    }).prototype = p = new cjs.Bitmap();
    p.nominalBounds = new cjs.Rectangle(0,0,1200,2102);
    
    
    (lib.CachedTexturedBitmap_40 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(1);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_41 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(2);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_42 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(3);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_43 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(4);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_44 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(5);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_45 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(6);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_46 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(7);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_47 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(8);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_48 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(9);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_49 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(10);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_50 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(11);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_51 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(12);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.CachedTexturedBitmap_52 = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(13);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.cliparttabletransparentbackgroundoriginal = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(14);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.DistilledWater = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(15);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.emptybeaker = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(16);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.Label = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(17);
    }).prototype = p = new cjs.Sprite();
    
    
    
    (lib.pngtreecartoonblueconicalflaskillustrationimage_1413155removebgpreview = function() {
        this.initialize(ss["toolbar_atlas_2"]);
        this.gotoAndStop(18);
    }).prototype = p = new cjs.Sprite();
    // helper functions:
    
    function mc_symbol_clone() {
        var clone = this._cloneProps(new this.constructor(this.mode, this.startPosition, this.loop));
        clone.gotoAndStop(this.currentFrame);
        clone.paused = this.paused;
        clone.framerate = this.framerate;
        return clone;
    }
    
    function getMCSymbolPrototype(symbol, nominalBounds, frameBounds) {
        var prototype = cjs.extend(symbol, cjs.MovieClip);
        prototype.clone = mc_symbol_clone;
        prototype.nominalBounds = nominalBounds;
        prototype.frameBounds = frameBounds;
        return prototype;
        }
    
    
    (lib.Symbol24 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.BeakerOfWater();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.289,0.2445);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0,0,65.1,77);
    
    
    (lib.Symbol23 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.pngtreecartoonblueconicalflaskillustrationimage_1413155removebgpreview();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.4713,0.4307);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0,0,82,106);
    
    
    (lib.Symbol21 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.pngtreecartoonblueconicalflaskillustrationimage_1413155removebgpreview();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.2529,0.2277);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0,0,44,56);
    
    
    (lib.Symbol20 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.DistilledWater();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.4658,0.3889);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0,0,68,122.1);
    
    
    (lib.Symbol19 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.DistilledWater();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.2464,0.2105);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0,0,36,66.1);
    
    
    (lib.Symbol18 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.CachedTexturedBitmap_52();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.5,0.5);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol18, new cjs.Rectangle(0,0,6.5,11), null);
    
    
    (lib.Symbol15 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.CachedTexturedBitmap_51();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.8612,0.8612);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol15, new cjs.Rectangle(0,0,114.6,142.1), null);
    
    
    (lib.Symbol11 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.emptybeaker();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.813,0.8122);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol11, new cjs.Rectangle(0,0,110.6,134.9), null);
    
    
    (lib.Symbol10 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.emptybeaker();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.3132,0.2842);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol10, new cjs.Rectangle(0,0,42.6,47.2), null);
    
    
    (lib.Symbol9 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.CachedTexturedBitmap_50();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.5,0.5);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol9, new cjs.Rectangle(0,0,47,50.5), null);
    
    
    (lib.Symbol5 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.CachedTexturedBitmap_49();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.4484,0.4484);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol5, new cjs.Rectangle(0,0,96,99.1), null);
    
    
    (lib.Symbol3 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.CachedTexturedBitmap_48();
        this.instance.parent = this;
        this.instance.setTransform(-0.5,-0.5,0.5,0.5);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol3, new cjs.Rectangle(-0.5,-0.5,49.5,68), null);
    
    
    (lib.Symbol2copy = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.instance = new lib.burette();
        this.instance.parent = this;
        this.instance.setTransform(0,0,0.2036,0.2226);
    
        this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol2copy, new cjs.Rectangle(0,0,244.3,468), null);
    
    
    (lib.an_Label = function(options) {
        this._element = new $.an.Label(options);
        this._el = this._element.create();
        var $this = this;
        this.addEventListener('added', function() {
            $this._lastAddedFrame = $this.parent.currentFrame;
            $this._element.attach($('#dom_overlay_container'));
        });
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(0,0,100,22);
    
    p._tick = _tick;
    p._handleDrawEnd = _handleDrawEnd;
    p._updateVisibility = _updateVisibility;
    
    
    
    (lib.Symbol22 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.box1 = new lib.Symbol3();
        this.box1.name = "box1";
        this.box1.parent = this;
        this.box1.setTransform(24.2,31.6,1,0.9405,0,0,0,24.2,33.6);
        this.box1.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box1).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(-0.5,-0.4,49.5,63.9);
    
    
    (lib.Symbol17 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.box2 = new lib.Symbol5();
        this.box2.name = "box2";
        this.box2.parent = this;
        this.box2.setTransform(42.4,55.3,0.8814,1.1152,0,0,0,48.1,49.6);
        this.box2.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box2).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol17, new cjs.Rectangle(0,0,84.6,110.5), null);
    
    
    (lib.Symbol16 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.box4 = new lib.Symbol15();
        this.box4.name = "box4";
        this.box4.parent = this;
        this.box4.setTransform(33.35,41.05,0.5806,0.5799,0,0,0,57.4,70.8);
        this.box4.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box4).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol16, new cjs.Rectangle(0,0,66.5,82.4), null);
    
    
    (lib.Symbol14 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.beaker1 = new lib.Symbol11();
        this.beaker1.name = "beaker1";
        this.beaker1.parent = this;
        this.beaker1.setTransform(55.2,67.4,1,1,0,0,0,55.2,67.4);
    
        this.timeline.addTween(cjs.Tween.get(this.beaker1).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol14, new cjs.Rectangle(0,0,110.6,134.9), null);
    
    
    (lib.Symbol13 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.box3 = new lib.Symbol9();
        this.box3.name = "box3";
        this.box3.parent = this;
        this.box3.setTransform(23.5,25.2,1,1,0,0,0,23.5,25.2);
        this.box3.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box3).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol13, new cjs.Rectangle(0,0,47,50.5), null);
    
    
    (lib.Symbol12 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.beaker = new lib.Symbol10();
        this.beaker.name = "beaker";
        this.beaker.parent = this;
        this.beaker.setTransform(21.3,23.6,1,1,0,0,0,21.3,23.6);
    
        this.timeline.addTween(cjs.Tween.get(this.beaker).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol12, new cjs.Rectangle(0,0,42.6,47.2), null);
    
    
    (lib.Symbol8 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.buret = new lib.Symbol2copy();
        this.buret.name = "buret";
        this.buret.parent = this;
        this.buret.setTransform(112.3,207.1,0.9189,0.885,0,0,0,122.2,234);
    
        this.timeline.addTween(cjs.Tween.get(this.buret).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol8, new cjs.Rectangle(0,0,224.5,414.2), null);
    
    
    (lib.Symbol9_1 = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // Layer_1
        this.label = new lib.an_Label({'id': 'label', 'label':'', 'disabled':false, 'visible':true, 'class':'ui-label'});
    
        this.label.setTransform(19.6,19.6,0.4485,1.0782);
    
        this.instance_1 = new lib.CachedTexturedBitmap_47();
        this.instance_1.parent = this;
        this.instance_1.setTransform(110.9,41.15,0.5289,0.5289);
    
        this.instance_2 = new lib.CachedTexturedBitmap_46();
        this.instance_2.parent = this;
        this.instance_2.setTransform(102.45,31.8,0.5289,0.5289);
    
        this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.instance_2},{t:this.instance_1},{t:this.label}]}).wait(1));
    
    }).prototype = getMCSymbolPrototype(lib.Symbol9_1, new cjs.Rectangle(19.4,19.1,129.6,54.49999999999999), null);
    
    
    // stage content:
    (lib.toolbar = function(mode,startPosition,loop) {
        this.initialize(mode,startPosition,loop,{});
    
        // timeline functions:
        this.frame_0 = function() {
            var root=this;
            this.img1.on("pressmove",moveimg1);
            this.img2.visible=false;
            this.drop.visible=false;
            this.conical1.visible=false;
            this.beaker2.visible=false;
            this.beaker2.on("pressmove",movebeaker2);
            var s=0;
            function movebeaker2(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
            }
            function moveimg1(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
            }
            
            this.img2.on("pressmove",moveimg2);
            
            function moveimg2(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
                root.img2.rotation=0;
            }
            this.img1.on("pressup",dropimg1);
            
            function dropimg1()
            {
                if(root.img1.x>599.3 && root.img1.x<799.05 && root.img1.y>141.95 && root.img1.y<375.45)
                {
                    root.img1.visible=true;
                    root.img2.visible=false;
                    
                        
                }
                else
                {
                    root.img2.visible=true;
                    root.img1.visible=false;
                    root.img2.x=root.box2.x;
                    root.img2.y=root.box2.y;
                    
                }
            }
            this.img2.on("pressup",dropimg2);
            function dropimg2()
            {
                if(root.img2.x>599.3 && root.img2.x<799.05 && root.img2.y>141.95 && root.img2.y<375.45)
                {
                    root.img2.visible=false;
                    root.img1.visible=true;
                    root.img1.x=root.box1.x;
                    root.img1.y=root.box1.y;
                        
                }
                else
                {
                    root.img2.visible=true;
                    root.img1.visible=false;
                    
                    
                }
            }
            var root=this;
            this.beaker.on("pressmove",movebeaker);
            this.beaker1.visible=false;
            function movebeaker(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
            }
            
            this.beaker1.on("pressmove",movebeaker1);
            
            function movebeaker1(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
            }
            this.beaker.on("pressup",dropbeaker);
            
            function dropbeaker()
            {
                if(root.beaker.x>599.3 && root.beaker.x<799.05 && root.beaker.y>141.95 && root.beaker.y<375.45)
                {
                    root.beaker.visible=true;
                    root.beaker1.visible=false;
                    
                        
                }
                else
                {
                    root.beaker1.visible=true;
                    root.beaker.visible=false;
                    root.beaker1.x=root.box4.x;
                    root.beaker1.y=root.box4.y;
                    
                }
            }
            this.beaker1.on("pressup",beaker1);
            function beaker1()
            {
                if(root.beaker1.x>599.3 && root.beaker1.x<799.05 && root.beaker1.y>141.95 && root.beaker1.y<375.45)
                {
                    root.beaker1.visible=false;
                    root.beaker.visible=true;
                    root.beaker.x=root.box3.x;
                    root.beaker.y=root.box3.y;
                        
                }
                else
                {
                    root.beaker1.visible=true;
                    root.beaker.visible=false;
                    
                    
                }
            }
            
            this.conical1.on("pressup",dropConicall);
            
            function dropConicall()
            {
                if(root.conical1.x>70.85 && root.conical1.x<287.65 && root.conical1.y>110.5 && root.conical1.y<541.2)
                {
                    root.conical1.x=root.box5.x;
                    root.conical1.y=root.box5.y;
                    var s = prompt("Please enter a solution value:", "");
                    if(s!=0)
                    {
                        root.conical1.rotation=-90;
                        root.drop.visible=true;
                    }
                    else
                    {
                        root.conical1.rotation=0;
                        root.drop.visible=false;
                    }
                    
                }else
                {
                    root.conical1.rotation=0;
                    root.drop.visible=false;
                }
            }
            
            
            this.beaker2.on("pressup",dropBeaker);
            
            function dropBeaker()
            {
                if(root.beaker2.x>70.85 && root.beaker2.x<287.65 && root.beaker2.y>110.5 && root.beaker2.y<541.2)
                {
                    
                    root.beaker2.x=root.box6.x;
                    root.beaker2.y=root.box6.y;
                    
                    s = prompt("Please enter a solution value:");
                    if(s!=0)
                    {
                        
                        
                    }
                    else
                    {
                        
                        
                    }
                    
                }else
                {
                    
                    
                }
            }
            this.conical.on("pressmove",moveconical);
            function moveconical(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
            }
            
            this.conical1.on("pressmove",moveconical1);
            
            function moveconical1(e)
            {
                var p = stage.globalToLocal(e.stageX, e.stageY)
                e.currentTarget.x= p.x;
                e.currentTarget.y= p.y;
            }
            this.conical.on("pressup",dropconical);
            
            function dropconical()
            {
                if(root.conical.x>599.3 && root.conical.x<799.05 && root.conical.y>141.95 && root.conical.y<375.45)
                {
                    root.conical.visible=true;
                    root.conical1.visible=false;
                    
                        
                }
                else
                {
                    root.conical1.visible=true;
                    root.conical.visible=false;
                    root.conical1.x=root.box8.x;
                    root.conical1.y=root.box8.y;
                    
                }
            }
            this.conical1.on("pressup",conical1);
            function conical1()
            {
                if(root.conical1.x>599.3 && root.conical1.x<799.05 && root.conical1.y>141.95 && root.conical1.y<375.45)
                {
                    root.conical1.visible=false;
                    root.conical.visible=true;
                    root.conical.x=root.box7.x;
                    root.conical.y=root.box7.y;
                        
                }
                else
                {
                    root.conical1.visible=true;
                    root.conical.visible=false;
                    
                    
                }
            }
            this.beaker1.on("pressup",beakeer1);
            function beakeer1()
            {
                
                if(root.beaker1.x>582 && root.beaker1.x<702 && root.beaker1.y>30.05 && root.beaker1.y<137.05)
                {
                    
                    var k = prompt("Please enter a solution value:");
                    if(k!=0)
                    {
                        root.img2.rotation=-90;
                        root.beaker1.visible=false;
                        root.beaker2.visible=true;
                        root.beaker2.x=root.box9.x;
                        root.beaker2.y=root.box9.y;
                        
                    }
                    else
                    {
                        root.img2.rotation=0;
                        root.beaker1.visible=true;
                        root.beaker2.visible=false;
                        
                    }
                        
                }
                else
                {
                    root.img2.rotation=0;
                }
            
            }
            this.beaker2.on("pressup",beakeer2);
            function beakeer2()
            {
                if(root.beaker2.x>599.3 && root.beaker2.x<799.05 && root.beaker2.y>141.95 && root.beaker2.y<375.45)
                {
                    root.beaker2.visible=false;
                    root.beaker.visible=true;
                    root.beaker.x=root.box3.x;
                    root.beaker.y=root.box3.y;
                        
                }
                else
                {
                    root.beaker2.visible=true;
                    root.beaker.visible=false;
                    
                    
                }
            }
            this.button.on("pressup",button1);
            
            function button1()
            {
                document.getElementById('label').innerHTML=0;
            }
            this.beaker2.on("pressup",dropdom);
            
            function dropdom()
            {
                if(root.beaker2.x>394 && root.beaker2.x<796 && root.beaker2.y>389.95 && root.beaker2.y<537.9)
                {
                    root.beaker2.x=root.box10.x;
                    root.beaker2.y=root.box10.y;
                    if(s==10)
                    {
                        var v=(Math.floor(Math.random() * (81.1 - 80.1 + 1)) + 80.1).toFixed(1);
                        document.getElementById('label').innerHTML=v;
                    }
                    else if(s==20)
                    {
                        var v=(Math.floor(Math.random() * (114 - 112.9 + 1)) + 112.9).toFixed(1);
                        document.getElementById('label').innerHTML=v;
                    }
                    else if(s==30)
                    {
                        var v=(Math.floor(Math.random() * (139.1 - 138.1 + 1)) + 138.1).toFixed(1);
                        document.getElementById('label').innerHTML=v;
                    }
                    else if(s==40)
                    {
                        var v=(Math.floor(Math.random() * (159.1 - + 157.1)) + 157.1).toFixed(1);
                        document.getElementById('label').innerHTML=v;
                    }
                    else if(s==50)
                    {
                        var v=(Math.floor(Math.random() * (178.1 - 177.1 + 1)) + 177.1).toFixed(1);
                        document.getElementById('label').innerHTML=v;
                    }
                }
            }
        }
    
        // actions tween:
        this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));
    
        // beaker2
        this.beaker2 = new lib.Symbol24();
        this.beaker2.name = "beaker2";
        this.beaker2.parent = this;
        this.beaker2.setTransform(41.95,472.45,1,1,0,0,0,32.5,38.5);
        new cjs.ButtonHelper(this.beaker2, 0, 1, 1);
    
        this.timeline.addTween(cjs.Tween.get(this.beaker2).wait(1));
    
        // dom
        this.instance = new lib.CachedTexturedBitmap_45();
        this.instance.parent = this;
        this.instance.setTransform(576.25,469.25,0.5,0.5);
    
        this.button = new lib.Symbol9_1();
        this.button.name = "button";
        this.button.parent = this;
        this.button.setTransform(698.7,514.65,0.9453,0.9453,0,0,0,74.4,36.6);
    
        this.instance_1 = new lib.CachedTexturedBitmap_44();
        this.instance_1.parent = this;
        this.instance_1.setTransform(409.9,279.85,0.5,0.5);
    
        this.instance_2 = new lib.CachedTexturedBitmap_43();
        this.instance_2.parent = this;
        this.instance_2.setTransform(588.35,492.8,0.5,0.5);
    
        this.instance_3 = new lib.CachedTexturedBitmap_42();
        this.instance_3.parent = this;
        this.instance_3.setTransform(524,465,0.5,0.5);
    
        this.instance_4 = new lib.CachedTexturedBitmap_41();
        this.instance_4.parent = this;
        this.instance_4.setTransform(523.6,464.6,0.5,0.5);
    
        this.instance_5 = new lib.CachedTexturedBitmap_40();
        this.instance_5.parent = this;
        this.instance_5.setTransform(409.9,461.05,0.5,0.5);
    
        this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.instance_5},{t:this.instance_4},{t:this.instance_3},{t:this.instance_2},{t:this.instance_1},{t:this.button},{t:this.instance}]}).wait(1));
    
        // box10
        this.box10 = new lib.Symbol15();
        this.box10.name = "box10";
        this.box10.parent = this;
        this.box10.setTransform(418.55,484.9,0.5806,0.5799,0,0,0,57.4,70.8);
        this.box10.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box10).wait(1));
    
        // box9
        this.box9 = new lib.Symbol15();
        this.box9.name = "box9";
        this.box9.parent = this;
        this.box9.setTransform(563.55,162.9,0.5806,0.5799,0,0,0,57.4,70.8);
        this.box9.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box9).wait(1));
    
        // box8
        this.box8 = new lib.Symbol17();
        this.box8.name = "box8";
        this.box8.parent = this;
        this.box8.setTransform(749.5,92.4,1,1,0,0,0,42.3,55.2);
    
        this.timeline.addTween(cjs.Tween.get(this.box8).wait(1));
    
        // conical1
        this.conical1 = new lib.Symbol23();
        this.conical1.name = "conical1";
        this.conical1.parent = this;
        this.conical1.setTransform(470.5,463.35,1,1,0,0,0,41,53);
        new cjs.ButtonHelper(this.conical1, 0, 1, 1);
    
        this.timeline.addTween(cjs.Tween.get(this.conical1).wait(1));
    
        // box7
        this.box7 = new lib.Symbol22();
        this.box7.name = "box7";
        this.box7.parent = this;
        this.box7.setTransform(678.5,244.45,1,1,0,0,0,24.2,31.6);
        new cjs.ButtonHelper(this.box7, 0, 1, 1);
    
        this.timeline.addTween(cjs.Tween.get(this.box7).wait(1));
    
        // conical
        this.conical = new lib.Symbol21();
        this.conical.name = "conical";
        this.conical.parent = this;
        this.conical.setTransform(685.55,246.45,1,1,0,0,0,22,28);
        new cjs.ButtonHelper(this.conical, 0, 1, 1);
    
        this.timeline.addTween(cjs.Tween.get(this.conical).wait(1));
    
        // drop
        this.drop = new lib.Symbol18();
        this.drop.name = "drop";
        this.drop.parent = this;
        this.drop.setTransform(216.65,134.8,1,1,0,0,0,3.1,5.5);
    
        this.timeline.addTween(cjs.Tween.get(this.drop).wait(1));
    
        // beaker1
        this.beaker1 = new lib.Symbol14();
        this.beaker1.name = "beaker1";
        this.beaker1.parent = this;
        this.beaker1.setTransform(337.05,496.75,0.6101,0.621,0,0,0,55.2,67.5);
    
        this.timeline.addTween(cjs.Tween.get(this.beaker1).wait(1));
    
        // box6
        this.box6 = new lib.Symbol17();
        this.box6.name = "box6";
        this.box6.parent = this;
        this.box6.setTransform(216.2,460.4,1,1,0,0,0,42.3,55.2);
    
        this.timeline.addTween(cjs.Tween.get(this.box6).wait(1));
    
        // box5
        this.box5 = new lib.Symbol16();
        this.box5.name = "box5";
        this.box5.parent = this;
        this.box5.setTransform(275.15,110.55,1,1,0,0,0,33.3,41.1);
    
        this.timeline.addTween(cjs.Tween.get(this.box5).wait(1));
    
        // box4
        this.box4 = new lib.Symbol15();
        this.box4.name = "box4";
        this.box4.parent = this;
        this.box4.setTransform(335.75,479.55,0.5806,0.5799,0,0,0,57.4,70.8);
        this.box4.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box4).wait(1));
    
        // box3
        this.box3 = new lib.Symbol13();
        this.box3.name = "box3";
        this.box3.parent = this;
        this.box3.setTransform(681.25,179.55,1,1,0,0,0,23.5,25.2);
    
        this.timeline.addTween(cjs.Tween.get(this.box3).wait(1));
    
        // beaker
        this.beaker = new lib.Symbol12();
        this.beaker.name = "beaker";
        this.beaker.parent = this;
        this.beaker.setTransform(680.45,181.95,1,1,0,0,0,21.3,23.6);
    
        this.timeline.addTween(cjs.Tween.get(this.beaker).wait(1));
    
        // img2
        this.img2 = new lib.Symbol20();
        this.img2.name = "img2";
        this.img2.parent = this;
        this.img2.setTransform(565.5,462.45,1,1,0,0,0,34,61.1);
        new cjs.ButtonHelper(this.img2, 0, 1, 1);
    
        this.timeline.addTween(cjs.Tween.get(this.img2).wait(1));
    
        // box2
        this.box2 = new lib.Symbol5();
        this.box2.name = "box2";
        this.box2.parent = this;
        this.box2.setTransform(641.4,88.55,0.8814,1.1152,0,0,0,48.1,49.6);
        this.box2.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box2).wait(1));
    
        // burette
        this.burette = new lib.Symbol8();
        this.burette.name = "burette";
        this.burette.parent = this;
        this.burette.setTransform(173.75,335.6,0.9372,0.9862,0,0,0,112.3,207.1);
    
        this.timeline.addTween(cjs.Tween.get(this.burette).wait(1));
    
        // img1
        this.img1 = new lib.Symbol19();
        this.img1.name = "img1";
        this.img1.parent = this;
        this.img1.setTransform(630.55,177.45,0.8889,0.8181,0,0,0,18,33.1);
        new cjs.ButtonHelper(this.img1, 0, 1, 1);
    
        this.timeline.addTween(cjs.Tween.get(this.img1).wait(1));
    
        // box1
        this.box1 = new lib.Symbol3();
        this.box1.name = "box1";
        this.box1.parent = this;
        this.box1.setTransform(631.95,175.55,1,1,0,0,0,24.2,33.6);
        this.box1.visible = false;
    
        this.timeline.addTween(cjs.Tween.get(this.box1).wait(1));
    
        // too
        this.instance_6 = new lib._6624937();
        this.instance_6.parent = this;
        this.instance_6.setTransform(600,142,0.1053,0.1054);
    
        this.timeline.addTween(cjs.Tween.get(this.instance_6).wait(1));
    
        // table
        this.instance_7 = new lib.cliparttabletransparentbackgroundoriginal();
        this.instance_7.parent = this;
        this.instance_7.setTransform(-229.9,203.9,1.2691,0.9222);
    
        this.timeline.addTween(cjs.Tween.get(this.instance_7).wait(1));
    
        // bg
        this.instance_8 = new lib.Bitmap11();
        this.instance_8.parent = this;
        this.instance_8.setTransform(-284.5,-98.5,0.2382,0.208);
    
        this.timeline.addTween(cjs.Tween.get(this.instance_8).wait(1));
    
    }).prototype = p = new cjs.MovieClip();
    p.nominalBounds = new cjs.Rectangle(115.5,201.5,969.0999999999999,924.5999999999999);
    // library properties:
    lib.properties = {
        id: '76857F72BA2BB14CA406A3895EBC161A',
        width: 800,
        height: 600,
        fps: 24,
        color: "#CCCCCC",
        opacity: 1.00,
        manifest: [
            {src:"images2/Bitmap11.png?1619959535519", id:"Bitmap11"},
            {src:"images2/burette.png?1619959535519", id:"burette"},
            {src:"images2/toolbar_atlas_.png?1619959535473", id:"toolbar_atlas_"},
            {src:"images2/toolbar_atlas_2.png?1619959535474", id:"toolbar_atlas_2"},
            {src:"https://code.jquery.com/jquery-2.2.4.min.js?1619959535519", id:"lib/jquery-2.2.4.min.js"},
            {src:"components2/sdk/anwidget.js?1619959535519", id:"sdk/anwidget.js"},
            {src:"components2/ui/src/label.js?1619959535519", id:"an.Label"}
        ],
        preloads: []
    };
    
    
    
    // bootstrap callback support:
    
    (lib.Stage = function(canvas) {
        createjs.Stage.call(this, canvas);
    }).prototype = p = new createjs.Stage();
    
    p.setAutoPlay = function(autoPlay) {
        this.tickEnabled = autoPlay;
    }
    p.play = function() { this.tickEnabled = true; this.getChildAt(0).gotoAndPlay(this.getTimelinePosition()) }
    p.stop = function(ms) { if(ms) this.seek(ms); this.tickEnabled = false; }
    p.seek = function(ms) { this.tickEnabled = true; this.getChildAt(0).gotoAndStop(lib.properties.fps * ms / 1000); }
    p.getDuration = function() { return this.getChildAt(0).totalFrames / lib.properties.fps * 1000; }
    
    p.getTimelinePosition = function() { return this.getChildAt(0).currentFrame / lib.properties.fps * 1000; }
    
    an.bootcompsLoaded = an.bootcompsLoaded || [];
    if(!an.bootstrapListeners) {
        an.bootstrapListeners=[];
    }
    
    an.bootstrapCallback=function(fnCallback) {
        an.bootstrapListeners.push(fnCallback);
        if(an.bootcompsLoaded.length > 0) {
            for(var i=0; i<an.bootcompsLoaded.length; ++i) {
                fnCallback(an.bootcompsLoaded[i]);
            }
        }
    };
    
    an.compositions = an.compositions || {};
    an.compositions['76857F72BA2BB14CA406A3895EBC161A'] = {
        getStage: function() { return exportRoot.getStage(); },
        getLibrary: function() { return lib; },
        getSpriteSheet: function() { return ss; },
        getImages: function() { return img; }
    };
    
    an.compositionLoaded = function(id) {
        an.bootcompsLoaded.push(id);
        for(var j=0; j<an.bootstrapListeners.length; j++) {
            an.bootstrapListeners[j](id);
        }
    }
    
    an.getComposition = function(id) {
        return an.compositions[id];
    }
    
    
    an.makeResponsive = function(isResp, respDim, isScale, scaleType, domContainers) {		
        var lastW, lastH, lastS=1;		
        window.addEventListener('resize', resizeCanvas);		
        resizeCanvas();		
        function resizeCanvas() {			
            var w = lib.properties.width, h = lib.properties.height;			
            var iw = window.innerWidth, ih=window.innerHeight;			
            var pRatio = window.devicePixelRatio || 1, xRatio=iw/w, yRatio=ih/h, sRatio=1;			
            if(isResp) {                
                if((respDim=='width'&&lastW==iw) || (respDim=='height'&&lastH==ih)) {                    
                    sRatio = lastS;                
                }				
                else if(!isScale) {					
                    if(iw<w || ih<h)						
                        sRatio = Math.min(xRatio, yRatio);				
                }				
                else if(scaleType==1) {					
                    sRatio = Math.min(xRatio, yRatio);				
                }				
                else if(scaleType==2) {					
                    sRatio = Math.max(xRatio, yRatio);				
                }			
            }			
            domContainers[0].width = w * pRatio * sRatio;			
            domContainers[0].height = h * pRatio * sRatio;			
            domContainers.forEach(function(container) {				
                container.style.width = w * sRatio + 'px';				
                container.style.height = h * sRatio + 'px';			
            });			
            stage.scaleX = pRatio*sRatio;			
            stage.scaleY = pRatio*sRatio;			
            lastW = iw; lastH = ih; lastS = sRatio;            
            stage.tickOnUpdate = false;            
            stage.update();            
            stage.tickOnUpdate = true;		
        }
    }
    function _updateVisibility(evt) {
        if((this.getStage() == null || this._off || this._lastAddedFrame != this.parent.currentFrame) && this._element) {
            this._element.detach();
            stage.removeEventListener('drawstart', this._updateVisibilityCbk);
            this._updateVisibilityCbk = false;
        }
    }
    function _handleDrawEnd(evt) {
        var props = this.getConcatenatedDisplayProps(this._props), mat = props.matrix;
        var tx1 = mat.decompose(); var sx = tx1.scaleX; var sy = tx1.scaleY;
        var dp = window.devicePixelRatio || 1; var w = this.nominalBounds.width * sx; var h = this.nominalBounds.height * sy;
        mat.tx/=dp;mat.ty/=dp; mat.a/=(dp*sx);mat.b/=(dp*sx);mat.c/=(dp*sy);mat.d/=(dp*sy);
        this._element.setProperty('transform-origin', this.regX + 'px ' + this.regY + 'px');
        var x = (mat.tx + this.regX*mat.a + this.regY*mat.c - this.regX);
        var y = (mat.ty + this.regX*mat.b + this.regY*mat.d - this.regY);
        var tx = 'matrix(' + mat.a + ',' + mat.b + ',' + mat.c + ',' + mat.d + ',' + x + ',' + y + ')';
        this._element.setProperty('transform', tx);
        this._element.setProperty('width', w);
        this._element.setProperty('height', h);
        this._element.update();
    }
    
    function _tick(evt) {
        var stage = this.getStage();
        stage&&stage.on('drawend', this._handleDrawEnd, this, true);
        if(!this._updateVisibilityCbk) {
            this._updateVisibilityCbk = stage.on('drawstart', this._updateVisibility, this, false);
        }
    }
    
    
    })(createjs = createjs||{}, AdobeAn = AdobeAn||{});
    var createjs, AdobeAn;