// requires system: dnd5e and modules: magic items, better rolls 5e
// foundry v0.8.8

const itemName = 'Gulthias Bow';

const styles = {
    saveDc: {
        marginBottom: '5px',
        backgroundColor: '#ccccc2',
        borderColor: '#999',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderRadius: '3px',
        lineHeight: '24px',
        textAlign: 'center',
        fontSize: '14px',
        fontStyle: 'italic',
    },
    failedText: {
        fontSize: '20px',
        color: '#aa0200',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '24px',
    },
    succeededText: {
        fontSize: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '24px',
    },
}

const inline = style => {
    return Object.keys(style).reduce((acc, key) => (
        acc + key.split(/(?=[A-Z])/).join('-').toLowerCase() + ':' + style[key] + ';'
    ), '');
};

const sendChat = (actor, message) => {
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: message
    });
}

const getSaveDc = item => {
    const chargesDcsMap = new Map();
    chargesDcsMap.set(1, 20).set(2, 16).set(3, 12).set(4, 8);
    const charges = item.data.flags.magicitems.uses;
    if (charges === 0) {
        ui.notifications.warn(`The ${item.name} is out of charges.`);
        throw (`The ${item.name} is out of charges.`)
    }
    if (chargesDcsMap.get(charges)) {
        return chargesDcsMap.get(charges);
    }
    throw (`The ${item.name} has an invalid number of charges: ${charges}`);
}

const useVampiricStrike = async (actor, item) => {
    const saveDc = getSaveDc(item);

    // roll decrements item charges, do this after getting save DC
    MagicItems.roll(itemName,"Vampiric Strike");

    const saveRoll = await BetterRolls.rollSave(actor, "wis");
    // does BetterRolls have another way of getting this value?
    const saveResult = saveRoll.data.flags.betterrolls5e.entries[1].entries[0].total;
    let saveMessage = `<div style=${inline(styles.saveDc)}>Save DC: ${saveDc}</div>`;

    if (saveResult >= saveDc) {
        saveMessage += `<div style=${inline(styles.succeededText)}>Saved!</div>`;
        saveMessage += `<p>${actor.name} resisted madness.</p>`;
        sendChat(actor, saveMessage);

    } else {
        saveMessage +=`<div style=${inline(styles.failedText)}>Failed save!</div>`;
        saveMessage += `<p style='text-align:center;'>${actor.name} is afflicted with madness for <strong>${Math.floor(Math.random() * 10) + 1} minutes.</strong></p>`;
        sendChat(actor, saveMessage);
        const madnessTable = game.tables.entities.find(t => t.name === "Short-Term Madness");
        madnessTable.draw();
    }
}

if (!actor) {
    ui.notifications.warn(`You need to select a token before using this macro.`);
} else {
    const foundItem = actor.items.find(i => i.name === itemName);
    if (!foundItem) {
        ui.notifications.warn(`Can't find the ${itemName}; do you have the right token selected?`);
    } else {
        const item = actor.items.get(foundItem.id);

        try {
            await useVampiricStrike(actor, item);
        } catch {
            ui.notifications.warn(`An error has occurred.`);
        }
    }
}