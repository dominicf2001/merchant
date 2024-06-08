{ pkgs, ... }:

{
  packages = [ pkgs.nodejs pkgs.libuuid ];

  env = { LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.libuuid ]; };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    initialDatabases = [{ name = "merchant"; }];
  };

  languages.typescript.enable = true;

  # container
  containers.merchant.name = "prod";
  containers.merchant.copyToRoot = ./dist;
  containers.merchant.startupCommand = "devenv up";
}
