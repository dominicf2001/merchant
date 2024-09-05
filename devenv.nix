{ pkgs, ... }:

{
  packages = [ pkgs.nodejs pkgs.libuuid pkgs.discordchatexporter-cli ];

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
}
