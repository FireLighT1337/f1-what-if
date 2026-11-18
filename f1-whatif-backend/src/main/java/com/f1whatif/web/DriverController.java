package com.f1whatif.web;

import com.f1whatif.dto.DriverPhotoResponse;
import com.f1whatif.dto.DriverSeasonResponse;
import com.f1whatif.service.DriverPhotoService;
import com.f1whatif.service.DriverSeasonService;
import com.f1whatif.service.PhotoLookupException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DriverController {

    private final DriverSeasonService driverSeasonService;
    private final DriverPhotoService driverPhotoService;

    public DriverController(DriverSeasonService driverSeasonService, DriverPhotoService driverPhotoService) {
        this.driverSeasonService = driverSeasonService;
        this.driverPhotoService = driverPhotoService;
    }

    @GetMapping("/seasons/{year}/drivers/{driverId}/results")
    public DriverSeasonResponse results(@PathVariable int year, @PathVariable long driverId) {
        return driverSeasonService.driverSeason(year, driverId);
    }

    /** A photo is a nice extra, so a failed lookup answers "no photo" instead of an error. */
    @GetMapping("/drivers/{driverId}/photo")
    public DriverPhotoResponse photo(@PathVariable long driverId) {
        try {
            return driverPhotoService.photo(driverId);
        } catch (PhotoLookupException e) {
            return DriverPhotoResponse.none();
        }
    }
}
