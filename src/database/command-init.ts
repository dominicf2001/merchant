import { REST, Routes } from "discord.js";
import { APPLICATION_ID, TOKEN } from "src/utilities";
import { COMMANDS } from "./datastores/Commands";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(TOKEN);

(async () => {
    try {

        await rest.put(
            Routes.applicationCommands(APPLICATION_ID),
            { body: COMMANDS.map(command => command.data.metadata) },
        );

        console.log(
            `Successfully reloaded ${COMMANDS.length} application (/) commands.`,
        );
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();