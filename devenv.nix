{ pkgs, ... }:

{
  packages = [ pkgs.nodejs pkgs.libuuid pkgs.discordchatexporter-cli ];

  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.libuuid ];
    DISCORD_TOKEN = "";
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    initialDatabases = [{ name = "merchant"; }];
  };

  enterShell = ''
    devenv up -d
  '';

  languages.typescript.enable = true;
}
