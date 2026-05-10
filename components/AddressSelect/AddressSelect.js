"use client";

import { ChevronRight } from "lucide-react";
import Select, { components } from "react-select";
import { useState } from "react";
import addressData from "../../public/bangladesh-data.json";

/* eslint-disable */

export default function AddressSelect({
    selectedDistrict,
    setSelectedDistrict,
    selectedCity,
    setSelectedCity,
}) {
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [expandedState, setExpandedState] = useState(null);

    // Build options list
    const options = Object.entries(addressData.country_states).flatMap(
        ([stateId, stateName]) => {
            const stateOption = {
                value: stateId,
                label: stateName,
                type: "state",
                stateId,
                stateName,
            };

            const cities =
                Object.entries(addressData.country_cities[stateId] || {}).map(
                    ([cityId, cityName]) => ({
                        value: `${stateId}-${cityId}`,
                        label: `${stateName} → ${cityName}`,
                        type: "city",
                        stateId,
                        cityId,
                        stateName,
                        cityName,
                    })
                );

            return [stateOption, ...cities];
        }
    );

    // Custom option renderer
    const Option = (props) => (
        <components.Option {...props}>
            {props.data.type === "state" ? (
                <div className="flex w-full items-center justify-between font-bold text-[#1A1A1A]">
                    <span>{props.data.label} (District)</span>
                    <ChevronRight size={16} />
                </div>
            ) : (
                <span className="pl-4 text-[#666666]">{props.data.label}</span>
            )}
        </components.Option>
    );

    // Handle selection
    const handleChange = (selectedOptions) => {
        const last = selectedOptions?.[selectedOptions.length - 1];

        if (!last) {
            setSelectedDistrict(null);
            setSelectedCity(null);
            setExpandedState(null);
            return;
        }

        // When district is clicked — expand cities
        if (last.type === "state") {
            setSelectedDistrict(last.stateName);
            setSelectedCity(null);
            // Toggle expansion
            setExpandedState(last.stateId === expandedState ? null : last.stateId);
            setMenuIsOpen(true); // Keep menu open to pick city
        }

        // When city is clicked
        if (last.type === "city") {
            setSelectedDistrict(last.stateName);
            setSelectedCity(last.cityName);
            setExpandedState(null);
            setMenuIsOpen(false);
        }
    };

    // Filter: show states OR the expanded state's cities
    const filterOption = (option, input) => {
        const data = option.data;

        // Search Mode
        if (input) {
            return option.label.toLowerCase().includes(input.toLowerCase());
        }

        // Browse Mode
        if (expandedState) {
            if (data.type === "state" && data.stateId === expandedState) return true;
            if (data.type === "city" && data.stateId === expandedState) return true;
            return false;
        }

        // Default: Show only states
        return data.type === "state";
    };

    // Format controlled value for Select
    const getValue = () => {
        if (selectedDistrict && selectedCity) {
            return [
                {
                    value: `${selectedDistrict}-${selectedCity}`,
                    label: `${selectedDistrict} → ${selectedCity}`,
                    type: "combined",
                },
            ];
        }

        if (selectedDistrict) {
            return [
                {
                    value: selectedDistrict,
                    label: selectedDistrict,
                    type: "state",
                },
            ];
        }

        return [];
    };

    return (
        <div className="cursor-pointer relative z-50">
            <label className="mb-2 block text-[10px] font-bold tracking-widest uppercase text-[#999999]">
                Select Address <span className="text-red-500">*</span>
            </label>

            <Select
                className="text-[#1A1A1A] text-sm"
                options={options}
                components={{ Option }}
                value={getValue()}
                onChange={handleChange}
                isMulti
                isClearable
                menuIsOpen={menuIsOpen}
                onMenuOpen={() => setMenuIsOpen(true)}
                onMenuClose={() => setMenuIsOpen(false)}
                closeMenuOnSelect={false}
                filterOption={filterOption}
                placeholder="Select District -> Area"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        minHeight: '48px',
                        borderRadius: '0',
                        borderColor: state.isFocused ? '#1A1A1A' : '#E5E5E5',
                        boxShadow: 'none',
                        fontSize: '14px',
                        '&:hover': {
                            borderColor: '#1A1A1A'
                        }
                    }),
                    input: (base) => ({
                        ...base,
                        fontSize: '14px',
                    }),
                    placeholder: (base) => ({
                        ...base,
                        fontSize: '14px',
                        color: '#999999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }),
                    singleValue: (base) => ({
                        ...base,
                        fontSize: '14px',
                    }),
                    multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#F8F8F6',
                    }),
                }}
            />
        </div>
    );
}
