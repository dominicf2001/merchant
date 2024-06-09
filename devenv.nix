{ pkgs, ... }:

{
  packages = [ pkgs.nodejs pkgs.libuuid ];

  env = { LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.libuuid ]; };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    initialDatabases = [{ name = "merchant"; }];
    initdbArgs =
      [ "--unix_socket_directories" "/run/user/1000/devenv-810e9e1/postgres" ];
  };

  languages.typescript.enable = true;
}
