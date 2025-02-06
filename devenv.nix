{ pkgs, ... }:

{
  packages = with pkgs; [ 
    nodejs_20 
    pkgs.libuuid 
    discordchatexporter-cli 
    bun 
    pm2 
    air
    templ
  ];

  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.libuuid ];
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    initialDatabases = [{ name = "merchant"; }];
    listen_addresses = "127.0.0.1";
  };

  languages.typescript.enable = true;

  languages.go.enable = true;
}
