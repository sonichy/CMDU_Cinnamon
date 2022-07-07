const Applet = imports.ui.applet;
const Util = imports.misc.util;
const {GLib, Gio} = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
var label;
var db0 = 0, ub0 = 0, tt0=0, idle0 = 0;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.TextApplet.prototype._init.call(this, orientation, panel_height, instance_id);        
        //global.logError('sonichy');        
        this.set_applet_label("↑ 0KB/s\n↓ 0KB/s");        
        this.menuManager = new PopupMenu.PopupMenuManager(this);        
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        label = new St.Label();
        this.menu.addActor(label);
        
        //https://gjs.guide/guides/gjs/asynchronous-programming.html
        //GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, this.update); //real name function do not run
          
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {        		
        	 var net = this.net();        	   	 
         	 this.set_applet_label("↑ " + this.B2G(net.ubs) + "/s\n↓ " + this.B2G(net.dbs) + "/s");
         	 var s = _("Uptime: " + this.uptime() + "\nCPU: " + this.cpu() + "%\nMem: " + this.mem() + "\nUp: " + this.B2G(net.ub) + "\nDown: "+ this.B2G(net.db));
		 	 this.set_applet_tooltip(s); //resize flash
		 	 label.set_text(s);
            return true; // loop
    	 });    	  
    },
    
    uptime: function() {
    	  //https://gjs.guide/guides/gio/file-operations.html
        const file = Gio.File.new_for_path('/proc/uptime');
        const [, contents, etag] = file.load_contents(null);
        var t = contents.toString().split(' ');        
        var tt = Number(t[0]);
        var h = ~~(tt/3600);
        var m = ~~(tt%3600/60);
        if (m < 10)
            m = '0' + m;
        var s = ~~(tt%3600%60);
        if (s < 10)
            s = '0' + s;
        var hms = h + ':' + m + ':' + s;
        return hms;
    },
    
    cpu: function() {
        const file = Gio.File.new_for_path('/proc/stat');
        const [, contents, etag] = file.load_contents(null);
        var s = contents.toString().split('\n');
        var ca = s[0].split(/\s+/);
        var tt = 0;
        for (var i=1; i<ca.length; i++) {            
            tt += Number(ca[i]);
         }
        global.log(tt);
        var idle = Number(ca[4]);
        var p = ~~(((tt - tt0) - (idle - idle0)) * 100 / (tt - tt0));
        tt0 = tt;
        idle0 = idle;
        return p;
    },
    
    mem: function() {
        const file = Gio.File.new_for_path('/proc/meminfo');
        const [, contents, etag] = file.load_contents(null);
        var s = contents.toString().split('\n');        
        var MT = s[0].split(/\s+/);
        var MF = s[1].split(/\s+/);
        var mt = Number(MT[1]);
        var mf = Number(MF[1]);
        var mu = mt - mf;
        var p = ~~(mu / mt * 100);
        var m = this.B2G(mu*1024) + ' / '+ this.B2G(mt*1024) + ' = ' + p + '%';
        return m;
    },
    
    net: function() {
        const file = Gio.File.new_for_path('/proc/net/dev');
        const [, contents, etag] = file.load_contents(null);
        var l = contents.toString().trim().split('\n');        
        var db = 0, ub = 0;        
        for (var i=2; i<l.length; i++) {
            var la = l[i].trim().split(/\s+/);
            db += Number(la[1]);
            ub += Number(la[9]);
         }
        var dbs = db - db0;
        var ubs = ub - ub0;
        db0 = db;
        ub0 = ub;
        return {db, ub, dbs, ubs};
    },
    
    B2G: function(b) {
       var s = '';
       if (b > 999999999)
           s = (b / 1073741824).toFixed(2) + ' GB';
       else{
           if (b > 999999)
               s = (b / 1048576).toFixed(2) + ' MB';
           else{
               if (b > 999)
                   s = ~~(b / 1024) + ' KB';
               else
                   s = b + ' B';
           }
       }
       return s;
    },
    
    update: function() {
        var date = new Date();
        var s = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate() + "\n" + date.getHours() + ":" + date.getMinutes()+ ":" + date.getSeconds();
        this.set_applet_label(s);
        return true;	// loop
    },

    on_applet_clicked: function() {
        //Util.spawnCommandLine("gnome-system-monitor");
        this.menu.toggle();
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
