

String.prototype.startsWith = function(s){ return this.indexOf(s) === 0; };

String.prototype.contains = function(s){ return this.indexOf(s) > -1; };

String.prototype.endsWith = function(substr) { return (this.match(substr + "$") == substr); };

