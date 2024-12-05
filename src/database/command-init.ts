import { REST, Routes } from "discord.js";
import { loadCommands } from "src/command-utilities";
import { APPLICATION_ID, TOKEN } from "src/utilities";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(TOKEN);

(async () => {
    try {
        // We can't really use CommandFactory since it's built upon a guildId, so we need to load the commands ourselves
        const commands = await loadCommands();

        const data = await rest.put(
            Routes.applicationCommands(APPLICATION_ID),
            { body: commands.map((command) => command.data.metadata) },
        );

        console.log(
            `Successfully reloaded ${commands.length} application (/) commands.`,
        );
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
