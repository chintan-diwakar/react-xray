export function htmlShell(opts: {
  title: string;
  dataInline?: string;          // when embedded
  dataExternalPath?: string;    // when split
}): string {
  const data = opts.dataInline
    ? `<script type="application/json" id="data">${opts.dataInline}</script>`
    : `<script>
        fetch("${opts.dataExternalPath}").then(r => r.json()).then(data => {
          window.__RX_DATA__ = data;
          document.dispatchEvent(new Event("rx:data-loaded"));
        });
      </script>`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${opts.title}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;margin:24px;color:#1a1a1a}
    h1{margin:0 0 8px;font-size:18px}
    table{border-collapse:collapse;width:100%;margin:8px 0 24px}
    th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;font-size:13px}
    th{background:#fafafa;cursor:pointer}
    details{margin:4px 0}
    summary{cursor:pointer}
    code{font-family:ui-monospace,Menlo,monospace;font-size:12px}
    .dim{color:#999}
    .pill{display:inline-block;padding:1px 6px;border-radius:8px;background:#f0f0f0;font-size:11px}
  </style>
</head>
<body>
  <h1>react-xray report</h1>
  ${data}
  <div id="app">Loading…</div>
  <script>
    (function(){
      function read(){
        var el=document.getElementById("data");
        if(el) return JSON.parse(el.textContent||"{}");
        return window.__RX_DATA__||null;
      }
      function render(d){
        if(!d){document.getElementById("app").textContent="No data.";return;}
        var html="";
        html+="<p class=dim>"+d.meta.framework+" · "+d.meta.fileCount+" files · "+(d.meta.durationMs/1000).toFixed(2)+"s</p>";
        html+="<h2>Per-page reachability</h2>";
        html+="<table><thead><tr><th>Route</th><th>Direct</th><th>Transitive</th><th>External pkgs</th><th>LOC reached</th></tr></thead><tbody>";
        d.matrix.forEach(function(row){
          html+="<tr><td><code>"+row.pageRoute+"</code></td><td>"+row.directComponents.length+"</td><td>"+row.transitiveComponents.length+"</td><td>"+row.externalPackages.join(", ")+"</td><td>"+row.locReached+"</td></tr>";
        });
        html+="</tbody></table>";
        html+="<h2>Unused (strictly)</h2>";
        html+="<table><thead><tr><th>Component</th><th>File</th><th>LOC</th><th>Reasons</th></tr></thead><tbody>";
        d.unused.strictlyUnused.forEach(function(u){
          html+="<tr><td>"+u.name+"</td><td><code>"+u.file+"</code></td><td>"+u.loc+"</td><td>"+u.reasons.join("; ")+"</td></tr>";
        });
        html+="</tbody></table>";
        html+="<h2>Library adoption</h2>";
        html+="<table><thead><tr><th>Package</th><th>Component</th><th>Instances</th></tr></thead><tbody>";
        d.externals.forEach(function(e){
          html+="<tr><td><code>"+e.package+"</code></td><td>"+e.name+"</td><td>"+e.instances+"</td></tr>";
        });
        html+="</tbody></table>";
        document.getElementById("app").innerHTML=html;
      }
      var d=read();
      if(d){render(d);}
      else{document.addEventListener("rx:data-loaded",function(){render(window.__RX_DATA__);});}
    })();
  </script>
</body>
</html>`;
}
